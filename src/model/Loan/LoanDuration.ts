import mongoose, { Schema } from "mongoose";

const loanDurationSchema = new mongoose.Schema(
  {
    value: { type: Number, required: true },
    unit: {
      type: String,
      required: true,
      enum: ["day", "week", "month", "year"],
    },
  },
  {
    timestamps: true,
    collection: "loan_durations",
  }
);

export default mongoose.model("loanDuration", loanDurationSchema);
