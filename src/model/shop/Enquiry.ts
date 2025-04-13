import mongoose, { Schema } from "mongoose";
import { required } from "joi";

const EnquirySchema = new Schema(
	{
		shopId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "shop",
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		enquiryTypeId: {
			type: Schema.Types.ObjectId,
			ref: "vendorEnquiryType",
			required: true,
		},
		enquiryTypeText: {
			type: String,
			required: true,
		},
		reasonId: {
			type: Schema.Types.ObjectId,
			ref: "vendorEnquiryReason",
		},
		reasonText: {
			type: String,
			required: true,
		},
		documents: {
			type: [String],
			min: 1,
			max: 4,
		},
		description: {
			type: String,
		},
		sku: {
			type: String,
		},
		orderId: {
			type: String,
			ref: "order",
		},
		status: {
			type: String,
			default: "pending",
			enum: ["pending", "processing", "resolved"],
		},
	},
	{
		timestamps: true,
		collection: "enquiry",
	}
);

export const Enquiry = mongoose.model(
	"enquiry",
	EnquirySchema
);
