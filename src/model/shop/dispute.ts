import mongoose, { Schema } from "mongoose";

const disputeSchema = new mongoose.Schema(
	{
		orderID: {
			type: String,
			ref: "order",
			required: true,
		},
		shopID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "shop",
			required: true,
		},
		customerID: {
			type: Number,
			required: true,
		},
		type: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "disputeReason",
			required: true,
		},
		pickUPChoice: {
			type: String,
			required: true,
			enum: ["self", "pick-up"],
			default: "pick-up",
		},
		description: {
			type: String,
		},
		evidence: {
			type: [String],
		},
		status: {
			type: String,
			enum: [
				"requested",
				"approved",
				"rejected",
				"received",
				"refunded",
				"completed",
			],
			default: "requested",
			required: true,
		},
		address: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "userDeliveryAddress",
			required: true,
		},
		rejectionReason: {
			type: String,
			default: null,
		},
		rejectionDoc: {
			type: [String],
			default: null,
		},
	},
	{
		timestamps: true,
		collection: "disputes",
	}
);

export const DisputeModel = mongoose.model(
	"dispute",
	disputeSchema
);
