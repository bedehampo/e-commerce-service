import Loan from "../../model/Loan/Loan";
import { LoanStatusTypes } from "../../utils/interfaces";

export const getLoansService = async (userId: number) => {
  const loans = await Loan.find({ user: userId })
    .populate("loanType")
    .populate("loanBio")
    .populate("loanDuration");

  //get total amount of all loans applied by the user
  const totalLoanApplied = loans.reduce((acc, loan) => {
    return acc + loan.amount;
  }, 0);

  //get total outstanding amount of all loans applied by the user
  const totalOutstandingAmount = loans.reduce((acc, loan) => {
    if (loan.status === LoanStatusTypes.APPROVED) {
      return acc + loan.amount;
    }
    return acc;
  }, 0);
  return { loans, totalLoanApplied, totalOutstandingAmount };
};

export default getLoansService;
