import mongoose, { Schema } from "mongoose";
import { required } from "joi";

const disputeReason = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		duration: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
		collection: "disputeReason",
	}
);

export const DisputeReasonModel = mongoose.model(
	"disputeReason",
	disputeReason
);
