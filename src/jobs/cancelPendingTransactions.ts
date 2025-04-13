import cron from "node-cron";
import { Transactions } from "../model/Transactions";

const pendingDuration: number = +process.env.PENDING_DURATION || 4; // in hours

const scheduleCancelPendingTransactions = () => {
  cron.schedule("1 * * * *", async () => {
    try {
      const cutOffTime: Date = new Date();
      cutOffTime.setHours(cutOffTime.getHours() - pendingDuration);

      // Find all transactions that are still pending and are older than the cutOffTime
      const transactionsToCancel = await Transactions.find({
        status: "pending",
        createdAt: { $lt: cutOffTime },
      });

      console.log(transactionsToCancel);

      for (let transaction of transactionsToCancel) {
        transaction.status = "cancelled";
        await transaction.save();
      }

      console.log("All pending transactions cancelled");
    } catch (err) {
      console.error(`Error cancelling pending transactions: ${err.message}`);
    }
  });
};


export default scheduleCancelPendingTransactions;
