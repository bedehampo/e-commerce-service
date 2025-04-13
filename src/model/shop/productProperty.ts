import mongoose from "mongoose";

const ProductPropertySchema = new mongoose.Schema(
	{
		name: { type: String, unique: true, required: true },
		values: { type: [String], default: [] },
	},
	{
		timestamps: true,
		collection: "productProperties",
	}
);

export const ProductPropertyModel = mongoose.model(
	"ProductProperty",
	ProductPropertySchema
);
