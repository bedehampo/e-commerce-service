import { ILoanType } from "../../model/Loan/LoanType";
import { ILoanDuration,  LoanDurationUnit } from "../../types/loan";

export const calculateLoanRepayment = (
  amount: number,
  loanType: ILoanType,
  loanDuration: number
) => {
  let monthlyRepayment = 0;
  let totalRepayment = 0;
  let totalInterest = 0;
  let monthlyInterest = 0;

  if (loanType.durationSchedule.unit === LoanDurationUnit.DAY) {
    const durationInDays = loanDuration;

    let interestAccrued = amount * loanType.interestRate;
    totalRepayment = amount + interestAccrued;
    monthlyRepayment = totalRepayment;

    totalInterest = interestAccrued;
    monthlyInterest = interestAccrued;
  }

  if (loanType.durationSchedule.unit === LoanDurationUnit.MONTH) {
    const durationInMonths = loanDuration;
    let interestAccrued = amount * loanType.interestRate * durationInMonths;
    totalRepayment = amount + interestAccrued;
    monthlyRepayment = totalRepayment / durationInMonths;

    totalInterest = interestAccrued;
    monthlyInterest = interestAccrued / durationInMonths;
  }

  return { monthlyRepayment, totalRepayment, totalInterest, monthlyInterest };
};
