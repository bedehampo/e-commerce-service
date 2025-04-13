import mongoose from "mongoose";

const HashtagSchema = new mongoose.Schema(
	{
		tag: { type: String, unique: true },
	},
	{
		timestamps: true,
		collection: "hashtags",
	}
);

export const HashTag = mongoose.model(
	"hashtags",
	HashtagSchema
);
