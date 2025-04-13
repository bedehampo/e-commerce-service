import mongoose from "mongoose";

const ShopListSchema = new mongoose.Schema(
	{
		shopId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "shop",
		},
		name: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
		collection: "shoplists",
	}
);

export const ShopList = mongoose.model(
	"shoplists",
	ShopListSchema
);
