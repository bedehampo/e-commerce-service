import mongoose, { Schema } from "mongoose";

const paymentBreakDownSchema = new mongoose.Schema({
	dueDate: {
		type: Date,
		required: true,
	},
	amount: {
		type: Number,
		required: true,
	},
	interest: {
		type: Number,
		required: true,
	},
	paymentDate: {
		type: Date,
	},
	transactionReference: {
		type: String,
	},
	status: {
		type: String,
		enum: ["unpaid", "paid"],
		default: "unpaid",
	},
	defaulted: {
		type: Boolean,
		default: false,
	},
});

const BNPLSchema = new mongoose.Schema(
	{
		user: {
			type: Number,
			required: true,
		},
		orderIds: [String],
		orderPaymentGroupId: {
			type: Schema.Types.ObjectId,
			ref: "orderpaymentgroup",
		},
		commodityCost: {
			type: Number,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
			enum: [1, 2, 3, 4, 5, 6],
		},
		frequency: {
			type: String,
			required: true,
			enum: ["weekly", "monthly"],
		},
		upFrontPayment: {
			type: Number,
			required: true,
		},
		upFrontPercent: {
			type: Number,
			required: true,
		},
		motopayPaidAmount: {
			type: Number,
			required: true,
		},
		settledDebt: {
			type: Number,
			required: true,
		},
		remainingDebt: {
			type: Number,
			required: true,
		},
		signature: {
			type: Boolean,
			required: true,
		},
		status: {
			type: String,
			required: true,
			enum: ["pending", "cancel", "active", "completed"],
			default: "pending",
		},
		dueDate: {
			type: Date,
			required: true,
		},
		interest: {
			type: Number,
			required: true,
		},
		paymentBreakDown: [paymentBreakDownSchema],
	},
	{
		timestamps: true,
		collection: "bnpl",
	}
);

export const BNPLModel = mongoose.model("bnpl", BNPLSchema);
