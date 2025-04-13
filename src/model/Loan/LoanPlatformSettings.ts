import mongoose, { Schema } from "mongoose";
import { LoanEligibilityType } from "../../types/loan";

const loanPlatformSettingsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "loan_platform_settings",
  }
);

export default mongoose.model(
  "loanPlatformSettings",
  loanPlatformSettingsSchema
);
