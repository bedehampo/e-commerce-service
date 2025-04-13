import mongoose from "mongoose";

// prospective schema for the products field in the future
const ShopActionsSchema = new mongoose.Schema(
	{
		user: {
			type: Number,
			required: true,
		},
		action: {
			type: String,
			required: true,
			enum: [
				"added a new product.",
				"edited a product",
				"stocked up a product.",
				"updated product stock.",
				"reduced the stock of a product",
				"deleted a product",
				"viewed a transaction.",
				"accepted an order.",
				"rejected an order.",
				"viewed Inventory.",
				"updated your shop image",
				"viewed a product",
				"viewed an order.",
				"viewed shop analysis",
				"viewed shop disputes",
			],
		},
		shop: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "shop",
		},
	},
	{ timestamps: true, collection: "shopActions" }
);

export const ShopAction = mongoose.model(
	"shopAction",
	ShopActionsSchema
);
