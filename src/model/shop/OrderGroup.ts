import mongoose, { Schema } from "mongoose";
import {
	DellymanOrderStatus,
	OrderDeliveryStatus,
	OrderPaymentType,
	OrderStatus,
	OrderType,
} from "../../types/order";
import { DeliveryMerchant } from "./deliveryMerchant";
import { OrderDeliveryPrices } from "./orderDeliveryPrices";
import { Counter } from "../../model/shop/orderGroupCounter";

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

export const deliveryLocationSchema = new mongoose.Schema(
	{
		latitude: {
			type: Number,
			required: true,
			default: 0,
		},
		longitude: {
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

export const rejectionReasonSchema = new mongoose.Schema(
	{
		reasonForRejection: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "rejectedOrderReason",
		},
		userOwnRejectionReason: {
			type: String,
		},
	},
	{
		timestamps: false,
		_id: false,
	}
);

const OrderGroupSchema = new mongoose.Schema(
	{
		displayId: {
			type: String,
			unique: true,
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
		reasonForRejection: rejectionReasonSchema,
		orders: {
			type: [String],
			ref: "order",
			required: true,
		},
		totalAmount: {
			type: Number,
			float: true,
			required: true,
			default: 0.0,
		},
		orderType: {
			type: String,
			enum: OrderType,
			required: true,
		},
		totalDeliveryFee: {
			type: Number,
			float: true,
			default: 0.0,
		},
		status: {
			type: String,
			enum: [
				OrderStatus.PENDING,
				OrderStatus.ACCEPTED,
				OrderStatus.REJECTED,
				OrderStatus.CANCELLED,
				OrderStatus.DELIVERED,
				OrderStatus.READYFORPICKUP,
			],
			default: OrderStatus.PENDING,
		},
		pickUpDateTime: {
			type: Date,
			default: null,
		},
		deliveryMerchant: {
			type: mongoose.Schema.Types.ObjectId,

			ref: DeliveryMerchant,
		},
		deliveryAddress: deliveryLocationSchema,
		receiversName: {
			type: String,
		},
		receiversPhoneNumber: {
			type: String,
		},
		deliveryAddressDescription: {
			type: String,
		},
		shipmentId: {
			type: String,
		},
		deliveryStatus: {
			type: String,
			enum: OrderDeliveryStatus,
			default: OrderDeliveryStatus.PENDING,
		},
		deliveryDate: {
			type: Date,
			default: null,
		},
		paymentType: {
			type: String,
			enum: [
				OrderPaymentType.PAYBYWALLET,
				OrderPaymentType.PAYONDELIVERY,
				OrderPaymentType.BUYNOWPAYLATER,
			],
		},
		orderDeliveryDetails: {
			type: mongoose.Schema.Types.ObjectId,
			ref: OrderDeliveryPrices,
		},
		dellymanCompanyId: {
			type: Number,
		},
		acceptedAt: {
			type: Date,
		},
		dellymanDetails: DellyManDetailsSchema,
	},
	{
		timestamps: true,
		collection: "order_groups",
	}
);

// Pre-save hook to generate unique, sequential displayId
OrderGroupSchema.pre("save", async function (next) {
	if (!this.isNew) return next();

	try {
		// Find and increment the sequence value for 'orderGroup' counter
		const counter = await Counter.findByIdAndUpdate(
			{ _id: "orderGroup" },
			{ $inc: { sequence_value: 1 } },
			{ new: true, upsert: true }
		);

		// Generate the sequential displayId with leading zeros (15 digits)
		const paddedId = String(
			counter.sequence_value
		).padStart(15, "0");
		this.displayId = paddedId;

		next();
	} catch (error) {
		next(error);
	}
});

export const OrderGroup = mongoose.model(
	"ordergroup",
	OrderGroupSchema
);
