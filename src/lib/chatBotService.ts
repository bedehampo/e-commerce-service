import axios from "axios";
import config from "../config";

export class ChatBot {
	client: any;

	constructor() {
		this.client = axios.create({
			baseURL: config.chatBotService.baseUrl,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	setToken(token: string) {
		this.client.defaults.headers.common[
			"Authorization"
		] = `Bearer ${token}`;
	}

	async chatBot(question: string) {
		try {
			const response = await this.client.post(
				"/chatbot",
				question
			);
			let data = response.data;
			return data;
		} catch (error) {
            console.log(error);
            
			return error.response.data
		}
	}
}

export default new ChatBot();
