import mongoose, { Schema } from "mongoose";

const VendorEnquiryGroupSchema = new Schema(
	{
		name: { type: String, required: true, unique: true },
		types: [
			{
				type: Schema.Types.ObjectId,
				ref: "vendorEnquiryType",
			},
		],
	},
	{
		timestamps: true,
		collection: "vendor-enquiry-group",
	}
);

export const VendorEnquiryGroup = mongoose.model(
	"vendorEnquiryGroup",
	VendorEnquiryGroupSchema
);

const AdminShopFAQGroupSchema = new Schema(
	{
		name: { type: String, required: true, unique: true },
		faqs: [
			{
				type: Schema.Types.ObjectId,
				ref: "shop-faq",
			},
		],
	},
	{
		timestamps: true,
		collection: "shop-faq-group",
	}
);

export const AdminShopFAQGroupModel = mongoose.model(
	"shop-faq-group",
	AdminShopFAQGroupSchema
);
