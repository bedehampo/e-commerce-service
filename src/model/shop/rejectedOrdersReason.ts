import mongoose from "mongoose";

const RejectedOrderReasonSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		timestamps: true,
		collection: "rejectedOrderReason",
	}
);

export const RejectedOrderReason = mongoose.model(
	"rejectedOrderReason",
	RejectedOrderReasonSchema
);
