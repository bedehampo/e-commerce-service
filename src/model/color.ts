import mongoose from "mongoose";

const ColoursSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		hexCode: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		timestamps: true,
		collection: "colours",
	}
);

export const Colour = mongoose.model(
	"colours",
	ColoursSchema
);
