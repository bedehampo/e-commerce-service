import mongoose, { Schema } from "mongoose";

const stateSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		lgas: {
			type: [String],
			required: true,
		},
	},
	{
		timestamps: true,
		collection: "states",
	}
);

export const State = mongoose.model("state", stateSchema);
