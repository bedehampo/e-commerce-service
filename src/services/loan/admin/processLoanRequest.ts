import moment from "moment";
import {
  generateTransactionReference,
  notificationService,
} from "../../../utils/global";
import { LoanStatusTypes } from "../../../utils/interfaces";
import { ServiceError, ValidationError } from "../../../errors";
import { UserService } from "../../../lib/userService";
import Loan from "../../../model/Loan/Loan";
import {
  TransactionServiceResponse,
  TransactionStatusCode,
} from "../../../types/transactions";
import { TransactionService } from "../../../lib/transactionService";
import { AdminUser } from "../../../types/user";
import LoanApproval from "../../../model/Loan/LoanApproval";
import { ProcessLoanInput } from "../../../validation/loan.schema";
import computeLoanRepaymentSchedule from "../computeLoanRepaymentSchedule";
import LoanRepayment, {
  ILoanRepayment,
} from "../../../model/Loan/LoanRepayment";
import { LoanPaymentType, LoanRepaymentStatus } from "../../../types/loan";
import { AdminService } from "../../../lib/adminService";

const processLoanRequest = async (
  payload: ProcessLoanInput["body"],
  userService: UserService,
  transactionService: TransactionService,
  adminUser: AdminUser,
  adminService: AdminService,
  session: any
) => {
  const { loanId, status, remarks } = payload;
  const loan = await Loan.findById(loanId)
    .populate("loanType")
    .populate("loanDuration");

  const userId = loan.user;

  const user = await userService.getUserById(userId);
  if (!loan) {
    throw new ValidationError("Loan not found");
  }

  if (loan.status !== LoanStatusTypes.PENDING) {
    throw new ValidationError("Loan has already been processed");
  }

  const adminUserRole = adminUser.adminRole;

  // get loan approval for the adminUser's role
  const loanApproval = await LoanApproval.findOne({
    loan: loanId,
    role: adminUserRole,
  });

  if (!loanApproval) {
    throw new ValidationError(
      "You do not have permission to approve this loan"
    );
  }

  if (loanApproval.status !== LoanStatusTypes.PENDING) {
    throw new ValidationError("Loan has already been processed");
  }

  const allPendingLoanApprovals = await LoanApproval.find({
    loan: loanId,
    status: LoanStatusTypes.PENDING,
  });

  let isThisTheLastApproval = false;
  if (allPendingLoanApprovals.length === 1) {
    isThisTheLastApproval = true;
  }

  if (status === LoanStatusTypes.APPROVED) {
    loan.status = LoanStatusTypes.APPROVED;
    loanApproval.status = LoanStatusTypes.APPROVED;
    loanApproval.approvedByAdminUserId = adminUser._id;
    loanApproval.approvedByAdminUserName =
      adminUser.firstName + " " + adminUser.lastName;
    loan.startDate = new Date();

    const loanType = loan.loanType;
    const loanDuration = loan.loanDuration;

    //@ts-ignore
    const durationValue = loanDuration.value;
    //@ts-ignore
    const durationUnit = loanDuration.unit;

    const durationUnitInDays = {
      day: 1,
      week: 7,
      month: 30,
      year: 365,
    };

    const durationInDays = durationValue * durationUnitInDays[durationUnit];

    const dueDate = moment().add(durationInDays, "days").toDate();

    loan.dueDate = dueDate;

    if (isThisTheLastApproval) {
      const transactionReference = generateTransactionReference(10);
      const disburseLoanResponse = await transactionService.disburseLoanAdmin({
        parentRef: transactionReference,
        amount: loan.amount,
        userId: loan.user,
        phone: user.mobileNumber,
        accountNo: user.accountNumber,
      });
      // console.log(disburseLoanResponse);
      if (disburseLoanResponse.code !== TransactionStatusCode.SUCCESSFUL) {
        throw new ServiceError(disburseLoanResponse.description);
      }

      loan.disbursementTransactionReference = transactionReference;
    }

    await loan.save({
      session,
    });

    // compute loan repayment schedule
    const loanRepaymentSchedule = await computeLoanRepaymentSchedule(
      loan,
      loanDuration
    );

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

    const newLoanApproval = new LoanApproval({
      loan: loanId,
      approvedBy: adminUser,
      approvedDate: new Date(),
      remarks: remarks,
    });

    await newLoanApproval.save({
      session,
    });

    //send notification to user
    // const response = await notificationService.sendNotification(
    //   {
    //     sender: "MotoPay",
    //     subject: "Loan Approved",
    //     message: `Your loan request has been approved. You will receive the funds shortly`,
    //     notificationSource: "SHOP",
    //   },
    //   user
    // );
    await notificationService(
      "MotoPay",
      user,
      `Loan Approved`,
      `Your loan request has been approved. You will receive the funds shortly`
    );
    await session.commitTransaction();
    session.endSession();
    return true;
  } else if (status === LoanStatusTypes.REJECTED) {
    loan.status = LoanStatusTypes.REJECTED;
    await loan.save({
      session,
    });

    await session.commitTransaction();
    session.endSession();
    //send notification to user
    await notificationService(
      "MotoPay",
      user,
      `Loan Rejected`,
      `Your loan request has been rejected.`
    );
    return true;
  }
};

export default processLoanRequest;
