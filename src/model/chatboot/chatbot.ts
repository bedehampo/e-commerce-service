import mongoose from "mongoose";

const { Schema } = mongoose;

const ChatBotSchema = new Schema(
	{
		user: {
			type: Number,
			required: true,
		},
		chats: [
			{
				question: {
					text: String,
					time: Date,
				},
				reply: {
					text: String,
					time: Date,
				},
			},
		],
	},
	{
		timestamps: true,
		collection: "chatbots",
	}
);

export const ChatBot = mongoose.model(
	"ChatBot",
	ChatBotSchema
);
