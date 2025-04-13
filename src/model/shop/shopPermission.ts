import mongoose from "mongoose";

const ShopPermissionSchema = new mongoose.Schema(
	{
		permissionCode: {
			type: String,
			required: true,
			unique: true,
			enum: [
				"add_product",
				"edit_product",
				"stock_up",
				"delete_product",
				"view_transaction",
				"accept-reject-orders",
				"view_inventory",
				"update_shop_image",
				"view_product",
				"view_orders",
				"analysis",
				"disputes"
			],
		},
		permissionDescription: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
		collection: "shopPermissions",
	}
);

export const ShopPermission = mongoose.model(
	"shopPermission",
	ShopPermissionSchema
);
