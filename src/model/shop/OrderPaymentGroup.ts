import mongoose, { Schema } from "mongoose";

import { deliveryLocationSchema } from "./OrderGroup";
import {
  OrderPaymentStatus,
  OrderPaymentType,
  OrderType,
} from "../../types/order";
import { DeliveryMerchant } from "./deliveryMerchant";
import { OrderDeliveryPrices } from "./orderDeliveryPrices";

const ShopDeliveryDetailsSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shop",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    deliveryCost: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: false,
    id: false,
  }
);

const OrderPaymentGroupSchema = new mongoose.Schema(
  {
    user: {
      type: Number,
      required: true,
    },
    orders: {
      type: [String],
      ref: "order",
      required: true,
    },
    deliveryMerchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DeliveryMerchant,
    },
    shopDeliveryDetails: [ShopDeliveryDetailsSchema],
    totalAmount: {
      type: Number,
      float: true,
      required: true,
      default: 0.0,
    },
    subTotal: {
      type: Number,
      float: true,
      required: true,
      default: 0.0,
    },
    totalDiscount: {
      type: Number,
      float: true,
      required: true,
      default: 0.0,
    },
    totalDeliveryFee: {
      type: Number,
      float: true,
      required: true,
      default: 0.0,
    },
    orderType: {
      type: String,
      enum: OrderType,
    },
    paymentStatus: {
      type: String,
      enum: OrderPaymentStatus,
      default: OrderPaymentStatus.PENDING,
    },
    transactionReference: {
      type: String,
    },
    paymentType: {
      type: String,
      enum: [
        OrderPaymentType.PAYBYWALLET,
        OrderPaymentType.PAYONDELIVERY,
        OrderPaymentType.BUYNOWPAYLATER,
      ],
    },
    deliveryAddress: deliveryLocationSchema,
    deliveryAddressDescription: {
      type: String,
      required: true,
    },
    receiversName: {
      type: String,
      required: true,
    },
    receiversPhoneNumber: {
      type: String,
      required: true,
    },
    orderDeliveryDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: OrderDeliveryPrices,
    },
  },
  {
    timestamps: true,
    collection: "order_payment_groups",
  }
);

export const OrderPaymentGroup = mongoose.model(
  "orderpaymentgroup",
  OrderPaymentGroupSchema
);
