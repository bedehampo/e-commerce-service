// import * as referralCodes from "referral-codes";
// import { sendMessage } from "../services/sendMessage";
// import express from "express";

// Generate OTP
// export const generateOTP = (): string => {
// 	const charset = "0123456789";
// 	let otp = referralCodes
// 		.generate({
// 			length: 6,
// 			count: 1,
// 			charset: "0123456789",
// 		})
// 		.toString();
// 	return otp;
// };


// send OTP message to user
// export const sendOTPMessage = (PhoneNumber: string, otp: string) => {
// 	sendMessage(PhoneNumber, otp);
// 	console.log(`sent OTP ${otp} to ${PhoneNumber}`);
// };

// Generate OTP, save it to user's OTP field, and send SMS

// const generateAndSendOTP = async (
// 	req: express.Request,
// 	res: express.Response
// ) => {
// 	try {
// 		const { PhoneNumber } = req.body;
// 		const otp = generateOTP();
// 		const user = await User.findByIdAndUpdate(
// 			req.user._id,
// 			{ otp },
// 			{ new: true }
// 		)
// 		sendMessage(PhoneNumber, otp);
// 		return res
// 			.status(200)
// 			.json({ success: true, msg: "OTP generated and sent successfully", });
// 	} catch (error) {
// 		return res.status(500).json({ success: false, error: `${error}` });
// 	}
// };

// const sendAndSaveOTP = (phoneNumber: string, otp: string) => {
// 	try {
// 		// getting the otp from the otp function
// 		otp = generateOTP();
// 		// send the otp to user phoneNumber
// 		sendMessage(phoneNumber, otp);
// 	} catch (error) {
// 		console.log(`Error: ${error}`);
// 	}
// };
