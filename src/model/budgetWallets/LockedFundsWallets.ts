import mongoose, { Schema } from "mongoose";

const lockedFundActity: Schema = new Schema(
	{
		type: {
			type: String,
			enum: ["credit", "debit"],
			required: true,
		},
		amount: {
			type: Number,
			float: true,
			default: 0.0,
			required: true,
		},
		date: {
			type: Date,
			required: true,
		},
	},
);

export const LockedFundsSchema = new mongoose.Schema(
	{
		budgetTitle:{
			type: String,
			required: true,
			default: "LockedFund",
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: "user",
			required: true,
		},
		title: { type: String, required: true },
		amount: { type: Number, float: true, default: 0.0 },
		startDate: {
			type: Date,
			required: true,
			default: Date.now(),
		},
		dueDate: { type: Date, required: true },
		isDue: {
			type: Boolean,
			required: true,
			default: false,
		},
		fundSource: {
			type: String,
			required: true,
			default: "Main Wallet",
		},
		status: {
			type: String,
			enum: ["active", "withdrawed"],
			default: "active",
		},
		transactions: [lockedFundActity],
	},
	{
		timestamps: true,
		collection: "locked_funds",
	}
);

export const LockedFunds = mongoose.model(
	"lockedFunds",
	LockedFundsSchema
);
