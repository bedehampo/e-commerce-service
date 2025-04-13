import mongoose, { Schema } from "mongoose";

const shopReportSchema = new mongoose.Schema(
	{
		complaint: {
			type: String,
			required: true,
			unique: true,
		},
		reasons: [String],
	},
	{
		timestamps: true,
		collection: "shop-report",
	}
);

export const ShopReportModel = mongoose.model(
	"shop-report",
	shopReportSchema
);
