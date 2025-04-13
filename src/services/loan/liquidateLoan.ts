import { AuthorizationError, NotFoundError } from "../../errors";
import { TransactionService } from "../../lib/transactionService";
import { UserService } from "../../lib/userService";
import { checkUserById } from "../../middlewares/validators";
import Loan, { ILoan } from "../../model/Loan/Loan";
import LoanDuration from "../../model/Loan/LoanDuration";
import LoanLiquidation from "../../model/Loan/LoanLiquidation";
import LoanRepayment from "../../model/Loan/LoanRepayment";
import LoanType from "../../model/Loan/LoanType";
import { Liquidationtype, LoanRepaymentStatus } from "../../types/loan";
import { generateTransactionReference } from "../../utils/global";
import { LoanStatusTypes } from "../../utils/interfaces";
import { LiquidateLoanInput } from "../../validation/loan.schema";
import moment from "moment";

const LiquidateLoan = async (
  payload: LiquidateLoanInput["body"],
  userId: number,
  userService: UserService,
  transactionService: TransactionService,
  session: any
) => {
  const { loan_id, liquidation_type, amount, pin } = payload;
  const loan = await Loan.findById(loan_id);

  // Check if loan exists
  if (!loan) {
    throw new NotFoundError("Loan does not exist");
  }

  //check that user is the owner of the loan
  if (loan.user !== userId) {
    throw new AuthorizationError("Loan does not exist");
  }

  //check if loan is pending
  if (loan.status !== LoanStatusTypes.APPROVED) {
    throw new AuthorizationError("Loan is not approved or ongoing");
  }

  if (liquidation_type === Liquidationtype.FULL) {
    return await handleFullLiquidation(
      loan,
      session,
      userId,
      userService,
      transactionService,
      pin
    );
  }
  if (liquidation_type === Liquidationtype.PARTIAL) {
    return await handlePartialLiquidation(
      loan,
      amount,
      session,
      userId,
      userService,
      transactionService,
      pin
    );
  }
};

export default LiquidateLoan;

const handleFullLiquidation = async (
  loan: ILoan,
  session: any,
  userId: number,
  userService: UserService,
  transactionService: TransactionService,
  pin
) => {
  const user = await checkUserById(userId, userService);
  const loanDurationInMonths = await LoanDuration.findById(loan.loanDuration);

  if (!loanDurationInMonths) {
    throw new NotFoundError("Loan duration not found");
  }

  const liquidationDate = new Date();

  let daysAccrued = 0;

  let mostRecentRepaymentDueDate = loan.startDate;

  //get most recent repayment
  const mostRecentRepayment = await LoanRepayment.findOne({
    loan: loan._id,
    status: LoanRepaymentStatus.PAID,
  }).sort({ paymentDate: -1 });

  if (mostRecentRepayment) {
    mostRecentRepaymentDueDate = mostRecentRepayment.dueDate;
  }

  daysAccrued = moment(liquidationDate).diff(
    mostRecentRepaymentDueDate,
    "days"
  );

  const loanType = await LoanType.findById(loan.loanType);
  const monthlyInterestRate = loanType.interestRate;

  const dailyInterestRate = monthlyInterestRate / 30;

  //compute remaining principal
  const allLoanRepaymentsAfterMostRecentRepayment = await LoanRepayment.find({
    loan: loan._id,
    dueDate: { $gt: mostRecentRepaymentDueDate },
  });

  let remainingPrincipal = allLoanRepaymentsAfterMostRecentRepayment.reduce(
    (acc, repayment) => acc + repayment.principal,
    0
  );

  //compute interest accrued
  const interestAccrued = dailyInterestRate * daysAccrued * remainingPrincipal;

  //compute total amount payable
  const totalAmountPayable = remainingPrincipal + interestAccrued;

  // console.log("Total amount payable", totalAmountPayable);
  // console.log("Remaining principal", remainingPrincipal);
  // console.log("Interest accrued", interestAccrued);
  // console.log(
  //   "all loan repayments after most recent repayment",
  //   allLoanRepaymentsAfterMostRecentRepayment
  // );

  //update loan status
  await Loan.findByIdAndUpdate(
    loan._id,
    {
      status: LoanStatusTypes.COMPLETED,
    },
    { session }
  );

  await LoanRepayment.updateMany(
    {
      loan: loan._id,
      dueDate: { $gt: mostRecentRepaymentDueDate },
    },
    {
      status: LoanRepaymentStatus.LIQUIDATED,
    },
    { session }
  );

  const parentReference = generateTransactionReference(8);

  // call transaction service to debit wallet
  const initiateLoanRepaymentResponse =
    await transactionService.initiateLoanRepayment({
      userId,
      parentRef: parentReference,
      amount: totalAmountPayable,
      phone: user.mobileNumber,
      accountNo: user.accountNumber,
    });

  const transactionReference =
    initiateLoanRepaymentResponse.data.transactionRef;

  const newLiquidation = new LoanLiquidation({
    totalAmountPaid: totalAmountPayable,
    principalRemaining: remainingPrincipal,
    interestAccrued,
    loan: loan._id,
    liquidationType: Liquidationtype.FULL,
    parentReference,
    transactionReference,
  });

  await newLiquidation.save({ session });

  await transactionService.completeLoanRepayment(pin, {
    transactionRef: transactionReference,
    userId,
  });

  return true;
};

const handlePartialLiquidation = async (
  loan: ILoan,
  amount: number,
  session: any,
  userId: number,
  userService: UserService,
  transactionService: TransactionService,
  pin
) => {
  const user = await checkUserById(userId, userService);
  const loanDurationInMonths = await LoanDuration.findById(loan.loanDuration);

  if (!loanDurationInMonths) {
    throw new NotFoundError("Loan duration not found");
  }
  const partialLiquidationDate = new Date();

  let daysAccrued = 0;

  let mostRecentRepaymentDueDate = loan.startDate;

  //get most recent repayment
  const mostRecentRepayment = await LoanRepayment.findOne({
    loan: loan._id,
    status: LoanRepaymentStatus.PAID,
  }).sort({ paymentDate: -1 });

  if (mostRecentRepayment) {
    mostRecentRepaymentDueDate = mostRecentRepayment.dueDate;
  }

  daysAccrued = moment(partialLiquidationDate).diff(
    mostRecentRepaymentDueDate,
    "days"
  );

  let numberOfDaysAfterPartialLiquidation = 30 - daysAccrued;

  const loanType = await LoanType.findById(loan.loanType);
  const monthlyInterestRate = loanType.interestRate;

  const dailyInterestRate = monthlyInterestRate / 30;

  //compute remaining principal

  const allLoanRepaymentsAfterMostRecentRepayment = await LoanRepayment.find({
    loan: loan._id,
    dueDate: { $gt: mostRecentRepaymentDueDate },
  });

  let remainingPrincipalBeforePartialLiquidation =
    allLoanRepaymentsAfterMostRecentRepayment.reduce(
      (acc, repayment) => acc + repayment.principal,
      0
    );

  //compute interest accrued days before partial liquidation
  const interestAccruedDaysBeforePartialLiquidation =
    dailyInterestRate *
    daysAccrued *
    remainingPrincipalBeforePartialLiquidation;

  let totalAmountPayableToFullyLiquidateLoan =
    remainingPrincipalBeforePartialLiquidation +
    interestAccruedDaysBeforePartialLiquidation;

  //validate that the amount to be paid is not more than the total amount payable
  if (amount > totalAmountPayableToFullyLiquidateLoan) {
    throw new AuthorizationError("Amount exceeds total amount payable");
  }

  if (amount === totalAmountPayableToFullyLiquidateLoan) {
    return await handleFullLiquidation(
      loan,
      session,
      userId,
      userService,
      transactionService,
      pin
    );
  }

  //total amount payable before partial liquidation
  const totalAmountPayableBeforePartialLiquidation =
    amount - interestAccruedDaysBeforePartialLiquidation;

  //compute remaining principal after partial liquidation
  const remainingPrincipalAfterPartialLiquidation =
    remainingPrincipalBeforePartialLiquidation -
    totalAmountPayableBeforePartialLiquidation;

  //compute interest accrued days after partial liquidation
  const interestAccruedDaysAfterPartialLiquidation =
    dailyInterestRate *
    numberOfDaysAfterPartialLiquidation *
    remainingPrincipalAfterPartialLiquidation;

  //compute new principal and interest for the remaining months
  const numberOfRemainingMonths =
    allLoanRepaymentsAfterMostRecentRepayment.length;

  const newPrincipal =
    remainingPrincipalAfterPartialLiquidation / numberOfRemainingMonths;

  const newInterest =
    remainingPrincipalAfterPartialLiquidation * monthlyInterestRate;

  //get the next loan repayment and update the principal and interest
  const nextRepayment = await LoanRepayment.findOne({
    loan: loan._id,
    status: LoanRepaymentStatus.PENDING,
  }).sort({ dueDate: 1 });

  if (!nextRepayment) {
    throw new NotFoundError("No repayment found");
  }

  nextRepayment.principal = newPrincipal;
  nextRepayment.interest = interestAccruedDaysAfterPartialLiquidation;
  nextRepayment.amount =
    Number(newPrincipal) + Number(interestAccruedDaysAfterPartialLiquidation);

  await nextRepayment.save({ session });

  //Update the remaining loan repayments with the new principal and interest
  const remainingRepayments = await LoanRepayment.find({
    loan: loan._id,
    dueDate: { $gt: nextRepayment.dueDate },
  });

  for (let repayment of remainingRepayments) {
    repayment.principal = newPrincipal;
    repayment.interest = newInterest;
    repayment.amount = Number(newPrincipal) + Number(newInterest);

    await repayment.save({ session });
  }

  //create a new liquidation record
  const newLiquidation = new LoanLiquidation({
    totalAmountPaid: amount,
    principalRemaining: remainingPrincipalAfterPartialLiquidation,
    interestAccrued: interestAccruedDaysAfterPartialLiquidation,
    loan: loan._id,
    liquidationType: Liquidationtype.PARTIAL,
  });

  await newLiquidation.save({ session });

  const parentReference = generateTransactionReference(8);

  // call transaction service to debit wallet
  const initiateLoanRepaymentResponse =
    await transactionService.initiateLoanRepayment({
      userId,
      parentRef: parentReference,
      amount,
      phone: user.mobileNumber,
      accountNo: user.accountNumber,
    });

  const transactionReference =
    initiateLoanRepaymentResponse.data.transactionRef;

  await transactionService.completeLoanRepayment(pin, {
    transactionRef: transactionReference,
    userId,
  });

  return true;
};
