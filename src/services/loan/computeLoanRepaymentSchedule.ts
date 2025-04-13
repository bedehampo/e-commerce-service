import { NotFoundError } from "../../errors";
import Loan from "../../model/Loan/Loan";
import LoanDuration from "../../model/Loan/LoanDuration";
import LoanType from "../../model/Loan/LoanType";
import moment from "moment";

const computeLoanRepaymentSchedule = async (
  loan,
  loanDuration
): Promise<
  {
    dueDate: Date;
    principal: number;
    interest: number;
    balance: number;
    totalAmountPayableForTheMonth: number;
  }[]
> => {
  const numberOfMonths = loanDuration.value;

  const loanAmount = loan.amount;

  const loanTypeId = loan.loanType;

  const loanType = await LoanType.findById(loanTypeId);

  //flat monthly interest rate
  const flatMonthlynterestRate = loanType.interestRate;

  // compute loan repayment schedule
  const repaymentSchedule = [];

  const startDate = loan.startDate;
  let balance = loanAmount;
  let interest = loan.monthlyInterest;
  let principal = loanAmount / numberOfMonths;
  let dueDate = moment(startDate).add(1, "months").format("YYYY-MM-DD");
  let totalAmountPayableForTheMonth = principal + interest;

  for (let i = 0; i < numberOfMonths; i++) {
    balance = balance - principal;

    repaymentSchedule.push({
      dueDate,
      principal,
      interest,
      balance,
      totalAmountPayableForTheMonth,
    });

    dueDate = moment(dueDate).add(1, "months").format("YYYY-MM-DD");
  }

  return repaymentSchedule;
};

export default computeLoanRepaymentSchedule;
