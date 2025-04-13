import { AuthorizationError, ServiceError } from "../../errors";
import { TransactionService } from "../../lib/transactionService";
import { UserService } from "../../lib/userService";
import { checkUserById } from "../../middlewares/validators";
import Loan from "../../model/Loan/Loan";
import LoanRepayment from "../../model/Loan/LoanRepayment";
import { LoanPaymentType, LoanRepaymentStatus } from "../../types/loan";
import { generateTransactionReference } from "../../utils/global";
import { LoanDuePaymentInput } from "../../validation/loan.schema";

const loanDuePayment = async (
  payload: LoanDuePaymentInput["body"],
  userId: number,
  userService: UserService,
  transactionService: TransactionService,
  session: any
) => {
  const { loan_repayment_id, amount, pin } = payload;
  const user = await checkUserById(userId, userService);

  // Check if loan repayment exists
  const loanRepayment = await LoanRepayment.findById(loan_repayment_id);

  if (!loanRepayment) {
    throw new ServiceError("Loan repayment does not exist");
  }

  const loan = await Loan.findById(loanRepayment.loan);

  // Check if loan exists
  if (!loan) {
    throw new ServiceError("Loan does not exist");
  }

  //check that user is the owner of the loan
  if (loan.user !== userId) {
    throw new AuthorizationError("Loan does not exist");
  }

  //check if loan repayment is eligible for payment
  if (loanRepayment.status === LoanRepaymentStatus.PAID) {
    throw new ServiceError("Loan repayment has already been paid");
  }

  // validate that the amount to be paid is not more than the amount due
  if (amount > loanRepayment.amount) {
    throw new ServiceError("Amount to be paid is more than the amount due");
  }

  const currentDate = new Date();

  // get next loan repayment, sort by due date
  const repayments = await LoanRepayment.find({
    loan: loanRepayment.loan,
    status: LoanRepaymentStatus.PENDING,
  }).sort({ dueDate: 1 });

  const nextRepayment = repayments[0];

  if (nextRepayment._id.toString() !== loan_repayment_id) {
    throw new ServiceError("Loan repayment is not the next repayment");
  }

  const parentReference = generateTransactionReference(8);

  // call transaction service to debit wallet
  const initiateLoanRepaymentResponse =
    await transactionService.initiateLoanRepayment({
      userId,
      parentRef: parentReference,
      amount: amount,
      phone: user.mobileNumber,
      accountNo: user.accountNumber,
    });

  const transactionReference =
    initiateLoanRepaymentResponse.data.transactionRef;

  // process flow for partial repayment
  if (amount < loanRepayment.amount) {
    console.log("Partial repayment");

    const newRepayment = new LoanRepayment({
      amount: amount,
      loan: loanRepayment.loan,
      paymentType: LoanPaymentType.LOANDUEPARTIAL,
      parentRepayment: loanRepayment._id,
      dueDate: loanRepayment.dueDate,
      status: LoanRepaymentStatus.PAID,
    });

    newRepayment.parentReference = parentReference;
    newRepayment.transactionReference = transactionReference;
    newRepayment.paymentDate = currentDate;
    await newRepayment.save({ session });
    loanRepayment.amount = Number(loanRepayment.amount) - Number(amount);
    await loanRepayment.save({ session });
  } else {
    // console.log("Full repayment");
    // process flow for full repayment
    loanRepayment.status = LoanRepaymentStatus.PAID;
    loanRepayment.parentReference = parentReference;
    loanRepayment.transactionReference = transactionReference;
    loanRepayment.paymentDate = currentDate;

    await loanRepayment.save({ session });

    //check if loan repayment is the last repayment
    if (repayments.length === 1) {
      const loan = await Loan.findById(loanRepayment.loan);
      loan.status = "COMPLETED";
      loan.completedDate = currentDate;
      await loan.save({ session });
    }
  }

  await transactionService.completeLoanRepayment(pin, {
    transactionRef: transactionReference,
    userId,
  });

  return true;
};

export default loanDuePayment;
