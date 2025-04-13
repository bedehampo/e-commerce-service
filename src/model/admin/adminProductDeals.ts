import mongoose, { Schema } from "mongoose";

const adminProductDeals = new Schema(
	{
		dealName: {
			type: String,
			required: true,
			unique: true,
		},
		categoryId: {
			type: mongoose.Schema.ObjectId,
			required: true,
			ref: "category",
		},
		subCategories: [
			{
				subCategoryId: {
					type: mongoose.Schema.ObjectId,
					required: true,
					unique: true,
					ref: "subcategory",
				},
				image: {
					type: String,
					required: true,
				},
			},
		],
	},
	{
		timestamps: true,
		collection: "adminProductDeals",
	}
);

export const AdminPLCategoryModel = mongoose.model(
	"adminProductDeal",
	adminProductDeals
);
