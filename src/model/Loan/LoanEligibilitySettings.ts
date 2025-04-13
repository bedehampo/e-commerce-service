import mongoose, { Schema } from "mongoose";
import { LoanEligibilityType } from "../../types/loan";

const loanEligibilitySettingsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    key: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        LoanEligibilityType.account_tier,
        LoanEligibilityType.additional_credit_history,
        LoanEligibilityType.age,
        LoanEligibilityType.bank_account_history,
        LoanEligibilityType.credit_history,
        LoanEligibilityType.debt_to_income_ratio,
        LoanEligibilityType.employment_stability,
        LoanEligibilityType.income,
        LoanEligibilityType.loan_repayment_history,
      ],
    },
    value: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: "loan_eligibility_settings",
  }
);

export default mongoose.model(
  "loanEligibilitySettings",
  loanEligibilitySettingsSchema
);
