import mongoose, { Schema } from "mongoose";
import LoanType from "./LoanType";
// import LoanBio from "./LoanBio";
import { LoanStatusTypes } from "../../utils/interfaces";
import LoanDuration from "./LoanDuration";
import { RecovaMandateStatus } from "../../types/loan";
import LoanBioField from "./LoanBioField";
import LoanApproval from "./LoanApproval";
// import LoanBioField from "./LoanBioField";

export interface ILoan extends Document {
  _id: Schema.Types.ObjectId;
  amount: number;
  loanType: Schema.Types.ObjectId;
  user: number;
  status: string;
  loanDuration: number;
  disbursementTransactionReference: string;
  dueDate: Date;
  completedDate: Date;
  monthlyRepayment: number;
  payBackAmount: number;
  totalInterest: number;
  totalPaid: number;
  monthlyInterest: number;
  startDate: Date;
  recovaMandateStatus: RecovaMandateStatus;
  loanApproval: Schema.Types.ObjectId;
}

const fieldSchema = new mongoose.Schema({
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: LoanBioField,
  },
  value: {
    type: Schema.Types.Mixed,
  },
});

const loanSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    // loanCategory: { type: String, required: true },
    loanApplicationData: [fieldSchema],
    loanType: { type: Schema.Types.ObjectId, ref: LoanType },
    user: { type: Number, ref: "user" },
    // loanBio: { type: Schema.Types.ObjectId, ref: LoanBio },
    status: {
      type: String,
      default: LoanStatusTypes.PENDING,
      enum: LoanStatusTypes,
    },
    loanDuration: { type: Number, required: true },
    disbursementTransactionReference: { type: String },
    dueDate: { type: Date },
    completedDate: { type: Date },
    monthlyRepayment: { type: Number },
    payBackAmount: { type: Number },
    totalInterest: { type: Number },
    totalPaid: { type: Number },
    monthlyInterest: { type: Number },
    startDate: { type: Date },
    recovaMandateStatus: {
      type: String,
      enum: [
        RecovaMandateStatus.APPROVED,
        RecovaMandateStatus.DECLINED,
        RecovaMandateStatus.PENDING,
      ],
      default: RecovaMandateStatus.PENDING,
    },
    loanApproval: { type: Schema.Types.ObjectId, ref: LoanApproval },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ILoan>("loan", loanSchema);
