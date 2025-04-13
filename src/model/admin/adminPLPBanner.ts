import mongoose, { Schema } from "mongoose";

const plpBanner = new Schema(
	{
		banner: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		products: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "product",
				required: true,
				autopopulate: true,
			},
		],
	},
	{
		timestamps: true,
		collection: "plpBanners",
	}
);

export const PLPBannerModel = mongoose.model(
	"plpBanner",
	plpBanner
);
