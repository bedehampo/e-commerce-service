import mongoose from "mongoose";

const VariationSchema = new mongoose.Schema(
	{
		name: { type: String, unique: true },
		values: { type: [String], default: [] },
	},
	{
		timestamps: true,
		collection: "variations",
	}
);

export const Variation = mongoose.model(
	"variation",
	VariationSchema
);


