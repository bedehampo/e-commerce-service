import mongoose, { Schema } from "mongoose";
const adminProductSectionSchema = new Schema(
	{
		sectionName: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		timestamps: true,
		collection: "admin-product-section",
	}
);

export const AdminProductSectionModel = mongoose.model(
	"admin-product-section",
	adminProductSectionSchema
);
