import mongoose from "mongoose";
import { required } from "joi";

const CategorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		icon: {
			type: String,
			required: true,
		},
		image: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ["active", "inactive"],
			default: "active",
		},
		subCategories: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "subcategory",
			},
		],
	},
	{
		timestamps: true,
		collection: "categories",
	}
);

export const Category = mongoose.model(
	"category",
	CategorySchema
);
