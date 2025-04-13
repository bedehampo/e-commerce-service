import mongoose, { Document, Schema } from "mongoose";
import { LoanPaymentType, LoanRepaymentStatus } from "../../types/loan";

export interface ILoanRepayment {
  amount: number;
  principal: number;
  interest: number;
  loan: mongoose.Schema.Types.ObjectId;
  paymentType: LoanPaymentType;
  parentRepayment?: Schema.Types.ObjectId;
  dueDate?: Date;
  paymentDate?: Date;
  status: string;
  transactionReference?: string;
  parentReference?: string;
}

const loanRepaymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },

    principal: {
      type: Number,
    },
    interest: {
      type: Number,
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
    paymentType: {
      type: String,
      required: true,
      enum: [
        LoanPaymentType.FULL,
        LoanPaymentType.PARTIAL,
        LoanPaymentType.LOANDUEFULL,
        LoanPaymentType.LOANDUEPARTIAL,
      ],
      default: null,
    },
    parentRepayment: {
      type: Schema.Types.ObjectId,
      ref: "loanRepayment",
    },
    dueDate: { type: Date },
    paymentDate: { type: Date },
    status: {
      type: String,
      required: true,
      enum: [
        LoanRepaymentStatus.PAID,
        LoanRepaymentStatus.PENDING,
        LoanRepaymentStatus.OVERDUE,
        LoanRepaymentStatus.DEFAULTED,
        LoanRepaymentStatus.LIQUIDATED,
      ],
      default: LoanRepaymentStatus.PENDING,
    },
  },
  {
    timestamps: true,
    collection: "loan_repayment",
  }
);

const LoanRepayment = mongoose.model<ILoanRepayment>(
  "loanRepayment",
  loanRepaymentSchema
);

export default LoanRepayment;
