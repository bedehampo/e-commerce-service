import mongoose, { Schema } from "mongoose";
import { LoanPaymentType } from "../../types/loan";

const loanApprovalSchema = new mongoose.Schema(
  {
    loan: { type: Schema.Types.ObjectId, ref: "loan", required: true },
    remarks: { type: String },
    role: {
      type: String,
      required: true,
    },
    value: {
      type: String,
    },
    approvedByAdminUserId: {
      type: String,
    },
    approvedByAdminUserName: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
    },
    approvedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "loan_approvals",
  }
);

export default mongoose.model("loanApproval", loanApprovalSchema);


