import mongoose from "mongoose";

const returnProductSchema = new mongoose.Schema(
	{
		userId: {
			type: Number,
			required: true,
		},
		orderId: {
			type: mongoose.Types.ObjectId,
			ref: "order",
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		phoneNumber: {
			type: String,
			required: true,
		},
		pickUPChoice: {
			type: String,
			required: true,
			enum: ["self", "pick-up"],
			default: "pick-up",
		},
		address: {
			type: String,
			required: true,
		},
		reason: {
			type: String,
			required: true,
		},
		shop: {
			type: mongoose.Types.ObjectId,
			ref: "shop",
			required: true,
		},
		productId: {
			type: mongoose.Types.ObjectId,
			ref: "product",
			required: true,
		},
		status: {
			type: String,
			required: true,
			enum: [
				"pending",
				"accepted",
				"rejected",
				"resolved",
				"deleted",
			],
			default: "pending",
		},
	},
	{
		collection: "returned-products",
		timestamps: true,
	}
);

export const ReturnProductModel = mongoose.model(
	"returned-product",
	returnProductSchema
);
