const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);
const senderEmail = process.env.MAILGUN_SENDER_EMAIL;

const mg = mailgun.client({
	username: "MotoPay",
	key: process.env.MAILGUN_API_KEY,
});

export const sendEmail = async (
	email: string,
	subject: string,
	username: string,
	phrase: string
) => {
	try {
		const data = {
			from: senderEmail,
			to: email,
			subject: subject,
			html: `<h1>Welcome ${username}</h1>
		          <p>${phrase}</p>`,
		};
		await mg.messages
			.create(process.env.MAILGUN_BASE_URL, data)
			.then((msg) => {
				return {
					success: true,
					msg: "Something went wrong, please try again later",
				};
			});
		return {
			success: true,
			msg: "Email sent successfully",
		};
	} catch (err) {
		console.error(err);
		return {
			success: false,
			msg: err,
		};
	}
};
