import mongoose, { Schema } from "mongoose";

const loanAppealSchema = new mongoose.Schema(
  {
    user: { type: String },
    description: { type: String, required: true },
    supportingDocuments: [{ type: String }],
  },
  {
    timestamps: true,
    collection: "loan_appeals",
  }
);

export default mongoose.model("loanAppeal", loanAppealSchema);

