import mongoose, { Schema } from "mongoose";

const BankSchema = new mongoose.Schema(
  {
    bank: {
      type: String,
      default: "Motopay Digital Services",
    },
    bankCode: {
      type: String,
      default: "000017",
    },
    prefix: {
      type: String,
      default: "802",
    },
  },
  { _id: false }
);

const CustomerSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    customerCode: String,
  },
  {
    _id: false,
  }
);

const SpendLimitSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      default: null,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },
  },
  {
    _id: false,
  }
);

const AccountDetailsSchema = new mongoose.Schema(
  {
    accountName: String,
    accountNumber: String,
    bank: {
      type: BankSchema,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    customer: {
      type: CustomerSchema,
      required: true,
    },
    status: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    _id: false,
  }
);

const MainWalletSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
      float: true,
      default: 0.0,
    },
    spendLimit: {
      type: SpendLimitSchema,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    accountDetails: {
      type: AccountDetailsSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "main_wallets",
  }
);

export const MainWallet = mongoose.model("mainWallet", MainWalletSchema);
