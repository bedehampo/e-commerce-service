import mongoose, { Schema } from "mongoose";

const TransactionsSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    amount: {
      type: Number,
      float: true,
      default: 0.0,
      required: true,
    },
    sourceWallet: {
      type: String,
      enum: [
        "mainWallet",
        "lockedFund",
        "savingsTarget",
        "motoPoint",
        "loan",
        "admin",
      ],
    },
    destinationWallet: {
      type: String,
      enum: [
        "mainWallet",
        "lockedFund",
        "savingsTarget",
        "motoPoint",
        "outwardTransfer",
        "businessWallet",
        "null",
      ],
    },
    description: { type: String, default: null },
    transactionType: {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "successful", "failed", "cancelled"],
      required: true,
    },
    openingBalance: {
      type: Number,
      float: true,
      // required: true,
    },
    closingBalance: {
      type: Number,
      float: true,
      // required: true,
    },
    // channel: {
    // 	type: String,
    // 	enum: [
    // 		"ATM",
    // 		"Bank Transfer",
    // 		"Mobile",
    // 		"Pos",
    // 		"Web",
    // 		"USSD",
    // 	],
    // 	required: true,
    // },

    transferChannel: {
      type: String,
      enum: ["budpay", "interswitch", "Moto Transfer"],
    },

    reference: { type: String, default: null },
    txnDesc: {
      type: String,
    },
    txnFee: {
      type: Number,
      float: true,
      default: 0.0,
    },
    totalDebit: {
      type: Number,
      float: true,
      default: function () {
        return this.amount + this.txnFee;
      },
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

export const Transactions = mongoose.model("transactions", TransactionsSchema);
