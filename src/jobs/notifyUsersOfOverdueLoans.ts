import cron from "node-cron";
import Loan from "../model/Loan/Loan";
import { sendMessage } from "../services/sendMessage";
import { LoanStatusTypes, StatusTypes } from "../utils/interfaces";
import LoanRepayment from "../model/Loan/LoanRepayment";

const loanWarningCutoff: number = 3; // in days

export const scheduleNotifyUsersOfOverdueLoans = () => {
  cron.schedule("0 15 */3 * *", async () => {
    try {
      //find all loans that are due and and approved and update their status to unpaid

      const unpaidLoans = await LoanRepayment.find({
        dueDate: { $lt: new Date() },
      });

      unpaidLoans.forEach(async (loan) => {
        //@ts-ignore
        const phoneNumber = loan.user.phoneNumber.number;
        await sendMessage(phoneNumber, "Your loan is overdue");

        loan.status = LoanStatusTypes.APPROVED;
        await loan.save();
      });

      //send notifications
    } catch (err) {
      console.error(`Error cancelling pending transactions: ${err.message}`);
    }
  });
};

export const schedulePreDueDateLoanWarning = () => {
  cron.schedule("1 14 * * *", async () => {
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + loanWarningCutoff);

      const loansDueInThreeDays = await LoanRepayment.find({
        dueDate: { $lt: dueDate },
      }).populate("user");

      loansDueInThreeDays.forEach(async (loan) => {
        //@ts-ignore
        const phoneNumber = loan.user.phoneNumber.number;
        await sendMessage(phoneNumber, "Your loan is due in 3 days");
      });

      //send notifications
    } catch (err) {
      console.error(`Error cancelling pending transactions: ${err.message}`);
    }
  });
};

export default scheduleNotifyUsersOfOverdueLoans;
