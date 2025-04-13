import mongoose from "mongoose";

const adminFlashSaleProductsSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "product",
			required: true,
		},
	},
	{
		collection: "admin-flash-sale-products",
		timestamps: true,
	}
);

export const AdminFlashSales = mongoose.model(
	"admin-flash-sales-products",
	adminFlashSaleProductsSchema
);
