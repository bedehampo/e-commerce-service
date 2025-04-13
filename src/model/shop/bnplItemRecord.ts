import mongoose from "mongoose";
const items = new mongoose.Schema({
	parentRef: {
		type: String,
		required: true,
	},
	amount: {
		type: Number,
		required: true,
	},
	accountNo: {
		type: String,
		required: true,
	},
	shopName: {
		type: String,
		required: true,
	},
	itemName: {
		type: String,
		required: true,
	},
	quantity: {
		type: Number,
		required: true,
	},
	fee: {
		type: Number,
		default: 0,
	},
});
const BNPLItemRecordSchema = new mongoose.Schema(
	{
		user: {
			type: Number,
			required: true,
		},
		orderPaymentGroupId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "orderpaymentgroup",
		},
		items: [items],
	},
	{
		timestamps: true,
		collection: "bnplItemRecord",
	}
);

export const BNPLItemRecordModel = mongoose.model(
	"bnplItemRecord",
	BNPLItemRecordSchema
);
