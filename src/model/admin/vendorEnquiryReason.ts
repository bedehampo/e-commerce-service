import mongoose, { Schema } from "mongoose";
import { required } from "joi";

const VendorEnquiryReasonSchema = new Schema(
	{
		vendorEnquiryTypeId: {
			type: Schema.Types.ObjectId,
			ref: "vendorEnquiryType",
			required: true,
		},
		name: { type: String, required: true, unique: true },
	},
	{
		timestamps: true,
		collection: "vendor-enquiry-reason",
	}
);

export const VendorEnquiryReason = mongoose.model(
	"vendorEnquiryReason",
	VendorEnquiryReasonSchema
);
