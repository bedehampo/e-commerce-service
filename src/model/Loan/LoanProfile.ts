import mongoose, { Schema } from "mongoose";

const loanProfileSchema = new mongoose.Schema(
  {
    user: { type: Number },
    eligibilityScore: {
      type: Boolean,
    },
    eligibleAmount: { type: Number },
    defaults: { type: Number },
    income: { type: Number },
    age: { type: Number },
  },
  {
    timestamps: true,
    collection: "loan_profile",
  }
);

export default mongoose.model("loanProfile", loanProfileSchema);
