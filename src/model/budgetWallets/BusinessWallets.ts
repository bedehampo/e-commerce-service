import mongoose from "mongoose";
import { BusinessWalletType } from "../../utils/interfaces";

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

const BusinessSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      //      required: true,
    },
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchant",
      // required: true,
    },
    type: {
      type: String,
      enum: BusinessWalletType,
      default: BusinessWalletType.customer,
    },
    accountDetails: {
      type: AccountDetailsSchema,
      required: true,
    },
    balance: { type: Number, default: 0 },
    currency: {
      type: String,
      default: "NGN",
    },
  },
  {
    timestamps: true,
  }
);

export const BusinessWallet = mongoose.model("businessWallet", BusinessSchema);
