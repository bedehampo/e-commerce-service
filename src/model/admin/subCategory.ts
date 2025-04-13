import mongoose from "mongoose";

const SubCategorySchema = new mongoose.Schema(
	{
		categoryId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "category",
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		variations: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "variation",
			},
		],
		properties: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "ProductProperty",
			},
		],
	},
	{
		timestamps: true,
		collection: "subcategories",
	}
);

export const SubCategory = mongoose.model(
	"subcategory",
	SubCategorySchema
);
