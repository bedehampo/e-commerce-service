import mongoose from "mongoose";

const returnProductPolicySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		collection: "return-product-policy",
		timestamps: true,
	}
);

export const ReturnProductPolicyModel = mongoose.model(
	"return-product-policy",
	returnProductPolicySchema
);
