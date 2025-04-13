import mongoose from "mongoose";
import autopopulate from "mongoose-autopopulate";
import { CartItemStatus } from "../../types/order";

const selectImages = new mongoose.Schema({
	images: [],
	color: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "colours",
	},
});
// prospective schema for the products field in the future
const CartItemSchema = new mongoose.Schema(
	{
		user: {
			type: Number,
			required: true,
		},
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "product",
			required: true,
			autopopulate: { select: "stockQuantity productName" },
		},
		selectColorImage: selectImages,
		selected_variations: [
			{
				name: String,
				value: String,
			},
		],
		status: {
			type: String,
			enum: CartItemStatus,
			default: CartItemStatus.ACTIVE,
		},
		amount: {
			type: Number,
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			default: 1,
		},
		shop: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "shop",
			required: true,
		},
	},
	{ timestamps: true, collection: "cart_items" }
);

export const CartItem = mongoose.model(
	"cartitem",
	CartItemSchema
);
