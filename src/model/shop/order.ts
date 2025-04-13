import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";
import {
  DellymanOrderStatus,
  OrderDeliveryStatus,
  OrderPaymentStatus,
  OrderPaymentType,
  OrderStatus,
  OrderType,
} from "../../types/order";

const DellyManDetailsSchema = new mongoose.Schema(
  {
    OrderID: {
      type: Number,
    },
    OrderCode: {
      type: String,
    },
    CustomerID: {
      type: Number,
    },
    CompanyID: {
      type: Number,
    },
    TrackingID: {
      type: Number,
    },
    OrderDate: {
      type: String,
    },
    OrderStatus: {
      type: String,
      enum: [
        DellymanOrderStatus.PENDING,
        DellymanOrderStatus.REJECTED,
        DellymanOrderStatus.CANCELLED,
        DellymanOrderStatus.ASSIGNED,
        DellymanOrderStatus.ONHOLD,
        DellymanOrderStatus.CANCELLED,
        DellymanOrderStatus.COMPLETED,
        DellymanOrderStatus.INVALID,
        DellymanOrderStatus.RETURNED,
        DellymanOrderStatus.INTRANSIT,
        DellymanOrderStatus.PARTIALLY_RETURNED,
        DellymanOrderStatus.CANCEL_REQUEST,
        DellymanOrderStatus.REJECTION_REQUEST,
      ],
    },
    OrderPrice: {
      type: Number,
    },
    AssignedAt: {
      type: String,
    },
    PickedUpAt: {
      type: String,
    },
    DeliveredAt: {
      type: String,
    },
  },
  {
    timestamps: false,
  }
);

export interface IOrder {
  _id: string;
  user: number;
  shop: string;
  cartItem: string;
  orderType: string;
  price: number;
  status: string;
  returningCustomer: boolean;
  customerStatus: string;
  shopOwnerStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  receiversName: string;
  receiversPhoneNumber: string;
  discountTotal: number;
  deliveryAddress: {
    latitude: number;
    longitude: number;
  };
  deliveryAddressDescription: string;
  deliveryDate: Date;
  pickUpDateTime: Date;
  deliveryStatus: string;
  orderPaymentGroup: string;
  paymentType: string;
  transactionReference: string;
  suggestedReview: boolean;
  acceptedAt: Date;
}

const OrderSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => nanoid(),
    },
    user: {
      type: Number,
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shop",
      required: true,
    },
    cartItem: {
      type: Schema.Types.ObjectId,
      ref: "cartitem",
    },
    orderType: {
      type: String,
      enum: OrderType,
    },
    price: {
      type: Number,
      float: true,
      required: true,
    },
    status: {
      type: String,
      enum: [
        OrderStatus.INITIATED,
        OrderStatus.PENDING,
        OrderStatus.ACCEPTED,
        OrderStatus.REJECTED,
        OrderStatus.CANCELLED,
        OrderStatus.DELIVERED,
      ],
      default: OrderStatus.INITIATED,
    },
    returningCustomer: {
      type: Boolean,
      default: false,
    },
    customerStatus: {
      type: String,
      enum: ["cancelled", "received"],
    },
    shopOwnerStatus: {
      type: String,
      enum: ["accepted", "rejected"],
    },
    paymentMethod: {
      type: String,
      enum: ["wallet", "card"],
      default: "wallet",
    },
    paymentStatus: {
      type: String,
      enum: OrderPaymentStatus,
      // default: OrderPaymentStatus.PENDING,
      default: "pending",
    },
    receiversName: {
      type: String,
    },
    receiversPhoneNumber: {
      type: String,
    },
    discountTotal: {
      type: Number,
      float: true,
      default: 0,
    },
    deliveryAddress: {
      type: String,
    },
    deliveryDate: {
      type: Date,
      default: null,
    },
    pickUpDateTime: {
      type: Date,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: OrderDeliveryStatus,
      // default: OrderDeliveryStatus.PENDING,
      default: "pending",
    },
    orderPaymentGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orderpaymentgroup",
    },
    paymentType: {
      type: String,
      enum: [
        OrderPaymentType.PAYBYWALLET,
        OrderPaymentType.PAYONDELIVERY,
        OrderPaymentType.BUYNOWPAYLATER,
      ],
    },
    shipmentId: {
      type: String,
    },
    suggestedReview: {
      type: Boolean,
      default: false,
    },
    transactionReference: {
      type: String,
    },
    acceptedAt: {
      type: Date,
    },
    packageTime: {
      type: Date,
    },
    dellymanDetails: DellyManDetailsSchema,
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("order", OrderSchema);

// "OrderID": "6657",
// "OrderCode": "ORD6271",
// "CustomerID": "969",
// "CompanyID": null,
// "TrackingID": "410413591917",
// "OrderDate": "2024-08-28 07:19:49",
// "OrderStatus": "PENDING",
// "OrderPrice": "3000.00",
// "AssignedAt": null,
// "PickedUpAt": null,
// "DeliveredAt": null,

