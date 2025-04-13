import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
	{
		faqName: {
			type:String,
			required: true,
			unique: true,
		},
		content: [
			{ title: String, description: String, _id: false },
		],
	},
	{
		timestamps: true,
		collection: "faq",
	}
);

export const Faq = mongoose.model("faq", faqSchema);
