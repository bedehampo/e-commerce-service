import mongoose from "mongoose";

const DealResponseSchema = new mongoose.Schema(
	{
		shopId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "shop",
			required: true,
		},
        shopname:{
            type: String,
            required: true,
        },
	},
	{
		timestamps: true,
		collection: "dealresponses",
	}
);

export const DealResponse = mongoose.model(
	"dealresponse",
	DealResponseSchema
);
