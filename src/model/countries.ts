import mongoose from "mongoose";
import { required } from "joi";

const CountrySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		active: {
			type: Boolean,
			required: true,
			default: false,
		},
	},
	{
		timestamps: true,
		collection: "country",
	}
);

export const CountryModel = mongoose.model(
	"country",
	CountrySchema
);
