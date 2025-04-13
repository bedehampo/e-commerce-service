import config from "../../config";
import { calculateLoanRepaymentSchedule } from "../../controllers/loanController";
import {
  AuthorizationError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "../../errors";
import { UserService } from "../../lib/userService";
import { checkUserById } from "../../middlewares/validators";
import Loan from "../../model/Loan/Loan";
import LoanBio from "../../model/Loan/LoanBio";
import LoanDuration from "../../model/Loan/LoanDuration";
import LoanType, { ILoanType } from "../../model/Loan/LoanType";
import {
  ILoanDuration,
  LoanPaymentType,
  LoanRepaymentStatus,
  LoanTypesName,
  RecovaCreateConsentRequestPayload,
} from "../../types/loan";
import { LoanStatusTypes } from "../../utils/interfaces";
import { CreateLoanInput } from "../../validation/loan.schema";
import crcService from "../../lib/crc";
import mongoose from "mongoose";
import { TransactionService } from "../../lib/transactionService";
import { generateTransactionReference } from "../../utils/global";
import { TransactionStatusCode } from "../../types/transactions";
import { calculateLoanRepayment } from "./calculateLoanRepaymentSchedule";
import LoanEligibility from "../../model/Loan/LoanEligibility";
import createConsentRequest from "./createConsentRequestService";
import computeLoanRepaymentSchedule from "./computeLoanRepaymentSchedule";
import recovaService from "../../lib/recova";
import LoanRepayment, { ILoanRepayment } from "../../model/Loan/LoanRepayment";
import { z } from "zod";
import { PlatformConfig } from "../../model/admin/platformConfigs";
import configKeys from "../../types/platformConfigKeys";
import LoanApproval from "../../model/Loan/LoanApproval";

const createLoanService = async (
  userId,
  userService: UserService,
  transactionService: TransactionService,
  data: CreateLoanInput["body"],
  session: any
) => {
  const { amount, loanTypeId, bvn, loanDuration, loanApplicationData } = data;

  const user = await checkUserById(userId, userService);

  const userLoanEligibilityRecord = await LoanEligibility.findOne({
    user: userId,
  });

  if (!userLoanEligibilityRecord) {
    throw new AuthorizationError("User is not eligible for loan");
  }

  if (userLoanEligibilityRecord.eligibleFunds < amount) {
    throw new AuthorizationError(
      `User is not eligible for more than ${userLoanEligibilityRecord.eligibleFunds} naira`
    );
  }

  const loanType = (await LoanType.findById(loanTypeId).populate(
    "fields.field"
  )) as ILoanType;

  if (!loanType) {
    throw new NotFoundError("Loan type not found");
  }

  const loanTypeDurationUnit = loanType.durationSchedule.unit;
  const loanTypeDurationValue = loanType.durationSchedule.type;

  const maxLoanDuration = loanType.maxDuration;
  const minLoanDuration = loanType.minDuration;
  const maximumAmount = loanType.maxAmount;
  const minimumAmount = loanType.minAmount;

  if (loanDuration > Number(maxLoanDuration)) {
    throw new ValidationError(
      `Loan duration for ${loanType.title} loan must not be more than ${maxLoanDuration} months`
    );
  }

  // minimum check
  if (Number(amount) < Number(minLoanDuration)) {
    throw new ValidationError(
      `Amount for ${loanType.title} loan must not be less than ${minLoanDuration}`
    );
  }

  if (Number(amount) > Number(maximumAmount)) {
    throw new ValidationError(
      `Amount for ${loanType.title} loan must not be more than ${maximumAmount}`
    );
  }

  // Validate the dynamic fields
  const fieldValidations = loanType.fields.reduce((acc: any, field: any) => {
    if (field.required) {
      acc[field.field.key] = z.any().refine((value) => value !== undefined, {
        message: `${field.field.key} is required`,
      });
    }
    return acc;
  }, {});

  const dynamicSchema = z.object(fieldValidations);

  try {
    dynamicSchema.parse(loanApplicationData);
  } catch (e: any) {
    throw new ValidationError(e.errors[0].message);
  }

  const loanApplicationDataPayload = loanType.fields.map((field: any) => {
    return {
      field: field.field._id,
      value: loanApplicationData[field.field.key],
    };
  });

  const usersDateOfBirth = user.dob; //dd-mm-yyyy
  const age =
    new Date().getFullYear() - new Date(usersDateOfBirth).getFullYear();

  //find loan in which the user id is equal to the id of the user and the status is pending,approved or unpaid
  const existingLoan = await Loan.findOne({
    user: userId,
    status: {
      $in: [LoanStatusTypes.PENDING, LoanStatusTypes.APPROVED],
    },
  });

  // if (existingLoan) {
  //   throw new AuthorizationError("You have an existing loan");
  // }

  // if (!user.bvnVerified) {
  //   throw new AuthorizationError("BVN not verified");
  // }

  // //  console.log(loanDurationId, "loanDurationId");

  let loanBioPayload = {};

  const isLoanBioExist = await LoanBio.findOne({
    user: userId,
    loanType: loanTypeId,
  });

  // console.log("isLoanBioExist", isLoanBioExist);

  //calculate loan repayment schedule
  const { monthlyRepayment, totalRepayment, monthlyInterest, totalInterest } =
    calculateLoanRepayment(amount, loanType, loanDuration);

  const loan = new Loan({
    amount,
    loanType: loanTypeId,
    loanDuration: loanDuration,
    user: userId,
    loanApplicationData: loanApplicationDataPayload,
    payBackAmount: totalRepayment,
    totalInterest,
    monthlyInterest,
    monthlyRepayment,
  });

  const loanRepaymentSchedule = await computeLoanRepaymentSchedule(
    loan,
    loanDuration
  );
  const automaticLoanDisbursementCutOff = await PlatformConfig.findOne({
    key: configKeys.AUTOMATIC_LOAN_DISBURSEMENT_CUTOFF,
  });

  if (amount <= Number(automaticLoanDisbursementCutOff.value)) {
    // console.log("disbursing loan");

    const transactionReference = generateTransactionReference(10);

    const disburseLoanResponse = await transactionService.disburseLoanUser({
      parentRef: transactionReference,
      amount,
      userId,
      phone: user.mobileNumber,
      accountNo: user.accountNumber,
    });
    // console.log(disburseLoanResponse);
    if (disburseLoanResponse.code !== TransactionStatusCode.SUCCESSFUL) {
      throw new ServiceError(disburseLoanResponse.description);
    }

    loan.disbursementTransactionReference = transactionReference;
    loan.status = LoanStatusTypes.APPROVED;
    loan.startDate = new Date();

    // save loan repayments
    const loanRepayment: ILoanRepayment[] = loanRepaymentSchedule.map(
      (schedule) => {
        return {
          amount: schedule.totalAmountPayableForTheMonth,
          loan: loan._id,
          paymentType: LoanPaymentType.LOANDUEFULL,
          dueDate: schedule.dueDate,
          status: LoanRepaymentStatus.PENDING,
          principal: schedule.principal,
          interest: schedule.interest,
        };
      }
    );

    await LoanRepayment.insertMany(loanRepayment, { session });
  }

  await loan.save({ session });
  console.log("loan saved");

  const loanUnderWrittingRoles = await PlatformConfig.findOne({
    key: configKeys.LOAN_UNDERWRITER_ROLES,
  });

  const underwriterRoles = loanUnderWrittingRoles.values;
  const loanApprovalPayload = underwriterRoles.map((role) => {
    return {
      role,
      loan: loan._id,
    };
  });

  const loanApprovals = await LoanApproval.insertMany(loanApprovalPayload, {
    session,
  });

  console.log("loan approvals created");

  // if (!isLoanBioExist) {

  // const recovaCreateConsentPayload: RecovaCreateConsentRequestPayload = {
  //   bvn,
  //   loanReference: loan._id.toString(),
  //   customerID: userId,
  //   phoneNumber: user.mobileNumber,
  //   loanAmount: amount,
  //   repaymentType: "Recovery",
  //   customerName: user.firstName + " " + user.lastName,
  //   customerEmail: user.email,
  //   collectionPaymentSchedules: loanRepaymentSchedule.map((schedule) => {
  //     return {
  //       repaymentAmountInNaira: schedule.totalAmountPayableForTheMonth,
  //       repaymentDate: schedule.dueDate,
  //     };
  //   }),
  //   totalRepaymentExpected: totalRepayment,
  // };

  // await recovaService.createConsentRequest(recovaCreateConsentPayload);

  console.log("consent request created");

  return {
    loan,
    loanApplicationDataPayload,
  };
};

export default createLoanService;
