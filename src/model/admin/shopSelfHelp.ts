import mongoose from "mongoose";

const ShopSelfHelpSchema = new mongoose.Schema(
	{
		problem: {
			type: String,
			require: true,
			unique: true,
		},
		solution: {
			type: String,
			require: true,
			unique: true,
		},
	},
	{
		timestamps: true,
		collection: "ShopSelfHelp",
	}
);
export const ShopSelfHelp = mongoose.model(
	"shopSelfHelp",
	ShopSelfHelpSchema
);
