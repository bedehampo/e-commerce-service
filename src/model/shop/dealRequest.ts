import mongoose from "mongoose";
import { OrderDeliveryStatus, OrderPaymentStatus } from "../../types/order";

export enum DealRequestStatus {
  Pending = "pending",
  Ongoing = "ongoing",
  Completed = "completed",
  Rejected = "rejected",
  Deleted = "deleted",
}
export enum DealPaymentStatus {
  PENDING = "pending",
  INITIATED = "initiated",
  PAID = "paid",
  FAILED = "failed",
}

const paymentDetails = new mongoose.Schema({
  transactionReference: {
    type: String,
  },
  paymentDate: {
    type: Date,
  },
  paymentStatus: {
    type: String,
    enum: DealPaymentStatus,
    default: DealPaymentStatus.PENDING,
  },
  totalAmountWithDelivery: {
    type: Number,
    required: true,
  },
});

const DealRequestSchema = new mongoose.Schema(
  {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "deal",
      required: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      request: true,
    },
    status: {
      type: String,
      required: true,
      enum: DealRequestStatus,
      default: DealRequestStatus.Pending,
    },

    deliveryStatus: {
      type: String,
      enum: OrderDeliveryStatus,
      default: OrderDeliveryStatus.PENDING,
    },
    deliveryFee: {
      type: Number,
      required: true,
      float: true,
      default: 0.0,
    },
    deliveryMerchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchant",
    },
    // paymentInfo: paymentDetails,
    transactionReference: {
      type: String,
    },
    paymentDate: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: DealPaymentStatus,
      default: DealPaymentStatus.PENDING,
    },
    totalAmountWithDelivery: {
      type: Number,
    },
  },
  {
    timestamps: true,
    collection: "dealRequests",
  }
);

export const DealRequest = mongoose.model("dealRequest", DealRequestSchema);
