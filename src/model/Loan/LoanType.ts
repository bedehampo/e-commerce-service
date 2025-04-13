import mongoose, { Schema } from "mongoose";
import LoanBioField from "./LoanBioField";
// import LoanBioField from "./LoanBioField";

const durationScheduleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["fixed", "flexible"],
    },
    unit: {
      type: String,
      enum: ["weeks", "months", "years"],
      required: true,
    },
  },
  { _id: false }
);

export enum LoanTypeGroup {
  personal = "personal",
  sme = "sme",
}

export interface ILoanType {
  title: string;
  group: LoanTypeGroup;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  durationSchedule: {
    type: string;
    duration: number;
    unit: string;
  };
  minDuration: number;
  maxDuration: number;
  fields: Schema.Types.ObjectId[];
}

const fieldsSchema = new mongoose.Schema(
  {
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: LoanBioField,
    },
    required: {
      type: Boolean,
      required: true,
    },
    condition: {
      field: {
        type: String,
      },
      value: {
        type: Schema.Types.Mixed,
      },
    },
  },
  {
    _id: false,
  }
);

const loanTypeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    group: {
      type: String,
      required: true,
      enum: [LoanTypeGroup.personal, LoanTypeGroup.sme],
    },
    interestRate: { type: Number, required: true },
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    durationSchedule: durationScheduleSchema,
    minDuration: {
      type: Number,
      required: true,
    },
    maxDuration: {
      type: Number,
      required: true,
    },

    fields: [fieldsSchema],
  },
  {
    timestamps: true,
    collection: "loan_types",
  }
);

export default mongoose.model("loanType", loanTypeSchema);
