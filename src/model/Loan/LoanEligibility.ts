import mongoose, { Schema } from "mongoose";

const loanEligibilitySchema = new mongoose.Schema(
  {
    user: { type: Number, required: true },
    score: { type: Number, required: true },
    eligibleFunds: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: "loan_eligibility",
  }
);

export default mongoose.model("loanEligibility", loanEligibilitySchema);
