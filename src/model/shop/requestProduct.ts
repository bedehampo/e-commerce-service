import mongoose from "mongoose";
import { required } from "joi";

const requestProductSchema = new mongoose.Schema({
	user: {
		type: Number,
		required: true,
	},
	productName: {
		type: String,
		required: true,
	},
	brandName: {
		type: String,
		default: null,
	},
	duration: {
		type: String,
		required: true,
		enum: [
			"Immediate (1-3 days)",
			"Standard (4-7 days)",
			"Extended (7-14 days)",
		],
	},
	location: { type: String },
	moreInfo: { type: String },
	document: { type: String, default: null },
	status: {
		type: String,
		required: true,
		default: "pending",
		enum: ["pending", "resolved"],
	},
}); 

export const RequestProductModel = mongoose.model(
	"requestProduct",
	requestProductSchema
);
