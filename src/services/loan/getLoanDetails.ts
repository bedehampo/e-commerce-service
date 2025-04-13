import { NotFoundError } from "../../errors";
import Loan from "../../model/Loan/Loan";
import LoanRepayment from "../../model/Loan/LoanRepayment";
import { LoanRepaymentStatus } from "../../types/loan";
const getLoanDetailsService = async (loanId: string) => {
  const loan = await Loan.findById(loanId);

  if (!loan) {
    throw new NotFoundError("Loan not found");
  }

  // get the current date
  const currentDate = new Date();

  // get next loan repayment, sort by due date
  const repayments = await LoanRepayment.find({
    loan: loanId,
    status: LoanRepaymentStatus.PENDING,
  }).sort({ dueDate: 1 });

  const nextRepayment = repayments[0];

  return {
    loan,
    nextRepayment,
  };
};

export default getLoanDetailsService;
