import { NotFoundError } from "../errors";
import { successResponse } from "../helpers";
import { checkUserById } from "../middlewares/validators";
import { ChatBot } from "../model/chatboot/chatbot";
import { getUserIdAndUser } from "../services/product/productServices";
import { askChatbot } from "../utils/global";
import { CustomRequest } from "../utils/interfaces";
import { NextFunction, Response } from "express";

export const askMotoPay = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);

		let question = req.body.question;
		const questionDate = new Date();
		question = question.toString();

		const answer = await askChatbot(question);
		const answerText = answer;
		const answerDate = new Date();

		let chatbot = await ChatBot.findOne({
			user: userId,
		});

		if (!answer)
			throw new NotFoundError("No reply received");

		let chatData: {} = {
			question: {
				text: question,
				time: questionDate,
			},
			reply: {
				text: answerText,
				time: answerDate,
			},
		};

		if (chatbot) {
			chatbot.chats.push(chatData);
			await chatbot.save();
		} else {
			chatbot = new ChatBot({
				user: userId,
				chats: [chatData],
			});
			await chatbot.save();
		}
		return res.send(
			successResponse(
				"chat record successfully saved",
				chatData
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getChatBotHistory = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const chatBotHistory = await ChatBot.findOne({
			user: userId,
		});
		if (!chatBotHistory)
			throw new NotFoundError("user have not chat history");
		return res.send(
			successResponse(
				"chatbot history retrieved successfully",
				chatBotHistory
			)
		);
	} catch (error) {
		next(error);
	}
};
