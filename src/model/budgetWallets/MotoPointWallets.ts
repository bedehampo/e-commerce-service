import mongoose, { Schema } from "mongoose";

const MotopointSchema = new mongoose.Schema(
	{
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
		balance: { type: Number, default: 0 },
		transactions: [
			{
				type: { type: String, enum: ["earn", "redeem"], required: true },
				amount: { type: Number, required: true },
				date: { type: Date, default: Date.now },
				description: { type: String, required: true },
				transaction_id: { type: String, required: true },
			},
		],
	},
	{
		timestamps: true,
	}
);

export const MotopointModel = mongoose.model("motopoint", MotopointSchema);
