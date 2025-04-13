import LoanRepayment from "../../model/Loan/LoanRepayment";

const getLoanRepaymentSchedule = async (loanId) => {
  const loanRepayments = await LoanRepayment.find({
    loan: loanId,
  }).sort({
    dueDate: 1,
  });

  return loanRepayments;
};

export default getLoanRepaymentSchedule;
