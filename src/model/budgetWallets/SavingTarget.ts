import mongoose, { Schema } from "mongoose";
import { required } from "joi";

export enum SavingsTargetStatus {
  PENDING = "pending",
  ACTIVE = "active",
  WITHDREW = "withdrew",
}


const savingTargetActivity: Schema = new Schema({
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },
  amount: {
    type: Number,
    float: true,
    default: 0.0,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

const SavingTargetSchema = new mongoose.Schema(
  {
    budgetTitle: {
      type: String,
      required: true,
      default: "SavingTarget",
    },
    user: {
      type: Number,
      required: true,
    },
    title: { type: String, required: true },
    targetAmount: {
      type: Number,
      float: true,
      default: 0.0,
      required: true,
    },
    amount: { type: Number, float: true, default: 0.0 },
    balance: { type: Number, float: true, default: 0.0 },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    reminderDate: { type: Date },
    categories: {
      type: String,
      enum: [
        "rent",
        "wedding",
        "car",
        "school fees",
        "business",
        "shopping",
        "vacation",
        "others",
      ],
      required: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    setBudget: {
      type: Number,
      float: true,
      default: 0.0,
      required: true,
    },
    automateSaving: { type: Boolean, default: false },
    status: {
      type: String,
      enum: SavingsTargetStatus,
      default: SavingsTargetStatus.PENDING,
    },
    transactions: [savingTargetActivity],
  },
  {
    timestamps: true,
    collection: "savingTargets",
  }
);

export const SavingTargets = mongoose.model("savingTarget", SavingTargetSchema);

