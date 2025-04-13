import mongoose, { Schema } from "mongoose";
import {
  Liquidationtype,
  LoanPaymentType,
  LoanRepaymentStatus,
} from "../../types/loan";

export interface ILiquidation {
  totalAmountPaid: number;
  principalRemaining: number;
  interestAccrued: number;
  loan: mongoose.Schema.Types.ObjectId;
  transactionReference?: string;
  paymentType: string;
}

const loanLiquidationSchema = new mongoose.Schema(
  {
    totalAmountPaid: {
      type: Number,
      required: true,
    },

    principalRemaining: {
      type: Number,
      required: true,
    },
    interestAccrued: {
      type: Number,
      required: true,
    },
    loan: {
      type: Schema.Types.ObjectId,
      ref: "loan",
      required: true,
    },
    transactionReference: {
      type: String,
    },
    parentReference: {
      type: String,
    },
    liquidationType: {
      type: String,
      required: true,
      enum: [Liquidationtype.FULL, Liquidationtype.PARTIAL],
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "loan_liquidation",
  }
);

const LoanLiquidation = mongoose.model<ILiquidation>(
  "loanLiquidation",
  loanLiquidationSchema
);

export default LoanLiquidation;
