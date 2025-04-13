import mongoose, { Schema } from "mongoose";

const VendorEnquiryTypeSchema = new Schema(
	{
		vendorEnquiryGroupId: {
			type: Schema.Types.ObjectId,
			ref: "vendorEnquiryGroup",
			required: true,
		},
		name: { type: String, required: true, unique: true },
		reasons: [
			{
				type: Schema.Types.ObjectId,
				ref: "vendorEnquiryReason",
			},
		],
	},
	{
		timestamps: true,
		collection: "vendor-enquiry-type",
	}
);

export const VendorEnquiryType = mongoose.model(
	"vendorEnquiryType",
	VendorEnquiryTypeSchema
);

const AdminShopFAQSchema = new Schema(
	{
		faqGroupId: {
			type: Schema.Types.ObjectId,
			ref:"shop-faq-group"
		},
		question: {
			type: String,
			required: true,
			unique: true,
		},
		answer: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
		collection: "shop-faq",
	}
);

export const AdminShopFAQModel = mongoose.model(
	"shop-faq",
	AdminShopFAQSchema
);
