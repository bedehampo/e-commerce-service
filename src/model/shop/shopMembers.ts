import mongoose from "mongoose";

const ShopMemberSchema = new mongoose.Schema(
	{
		userId: {
			type: Number,
			required: true,
		},
		shopId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "shop",
		},
		permissions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "shopPermission",
			},
		],
		status: {
			type: String,
			enum: [
				"pending",
				"staff",
				"declined",
				"cancelled",
			],
			default: "pending",
		},
	},
	{
		timestamps: true,
		collection: "shopMembers",
	}
);

export const ShopMember = mongoose.model(
	"shopMember",
	ShopMemberSchema
);
