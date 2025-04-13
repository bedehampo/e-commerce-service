import mongoose, { Schema } from "mongoose";
const userReportOnShopProduct = new mongoose.Schema(
	{
		customerId: {
			type: Number,
			required: true,
		},
		shopId: {
			type: Schema.Types.ObjectId,
			ref: "Shop",
			required: true,
		},
		productId: {
			type: Schema.Types.ObjectId,
			ref: "product",
			required: true,
		},
		complaint: {
			type: Schema.Types.ObjectId,
			ref: "shop-report",
			required: true,
		},
		complaintDescription: {
			type: String,
			required: true,
		},
		optionalDescription: {
			type: String,
			default: null,
		},
		status: {
			type: String,
			default: "pending",
			enum: ["pending", "resolved"],
		},
		reportType: {
			type: String,
			enum: ["product", "shop"],
			default: "product",
			required: true,
		},
	},
	{
		timestamps: true,
		collection: "user-report",
	}
);

export const UserReportModel = mongoose.model(
	"user-report",
	userReportOnShopProduct
);
