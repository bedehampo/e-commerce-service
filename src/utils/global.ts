import axios, {
	AxiosRequestConfig,
	AxiosError,
} from "axios";
import { Response } from "express";
import { string } from "joi";
import jwt from "jsonwebtoken";
import moment from "moment";
import mongoose, { Types } from "mongoose";
import * as referralCodes from "referral-codes";
import config from "../config/index";
import countriesNames from "countries-names";
import {
	AuthorizationError,
	NotFoundError,
	ValidationError,
} from "../errors";
// import { User } from "../model/User";
import { AdminUser } from "../model/admin/adminUser";
import { sendMessage } from "../services/sendMessage";
import { CustomRequest } from "./interfaces";
import { checkUserById } from "../middlewares/validators";
import userService, {
	UserService,
} from "../lib/userService";
import crypto from "crypto";
import { Order } from "../model/shop/order";
import { OrderPaymentStatus } from "../types/order";
import { Shop } from "../model/shop/shop";
import { CartItem } from "../model/shop/cartItem";
import { Product } from "../model/shop/product";
import { SubCategory } from "../model/admin/subCategory";
import { AdminProductSectionModel } from "../model/admin/adminProductSection";
import Decimal from "decimal.js";
import { nanoid } from "nanoid";
import { CountryModel } from "../model/countries";
import { OrderGroup } from "../model/shop/OrderGroup";

const authBaseUrl = process.env.AUTH_BASE_URL;

interface AxiosConfigArgs {
	reqMethod: string;
	reqUrl: string;
	token: string;
}

export const axiosConfig = ({
	reqMethod,
	reqUrl,
	token,
}: AxiosConfigArgs): AxiosRequestConfig => {
	return {
		method: reqMethod, // Specify the HTTP method you want to use
		url: `${authBaseUrl}/${reqUrl}`, // Specify the URL you want to request
		headers: {
			Authorization: `Bearer ${token}`, // Add your token to the headers
		},
	};
};

export const generateRefCode = () => {
	return referralCodes
		.generate({
			length: 6,
			count: 1,
			charset: "0123456789",
		})
		.toString();
};

export const getSalesCount = async (shopId) => {
	try {
		const salesCount = await Order.aggregate([
			{
				$match: {
					shop: new mongoose.Types.ObjectId(shopId),
					paymentStatus: OrderPaymentStatus.PAID,
				},
			},
			{
				$group: {
					_id: "$shop",
					totalSales: { $sum: 1 },
				},
			},
		]);

		return salesCount;
	} catch (error) {
		throw error;
	}
};

export const generateOtp = () => {
	return referralCodes
		.generate({
			length: 4,
			count: 1,
			charset: "0123456789",
		})
		.toString();
};

// export const generatePassword = () => {
//   return referralCodes
//     .generate({
//       length: 6,
//       count: 1,
//       charset: "0123456789",
//     })
//     .toString();
// };

// export const sendOtp = async (
//   phoneNumber: string,
//   otp: string,
//   userId: string,
//   res: Response
// ) => {
//   try {
//     const msg = `Use this code ${otp} to verify your account, code expires in 5 mins.`;

//     const expiresAt = moment().add(5, "minutes");

//     await User.findByIdAndUpdate(userId, {
//       "otp.otp": otp,
//       "otp.code_expires_at": expiresAt,
//     });

//     await sendMessage(phoneNumber, msg);

//     return true;
//   } catch (err) {
//     console.error(err);
//     return false;
//   }
// };

// export const validateOtp = async (otp: string, userId: string) => {
//   const user = await User.findById(userId);

//   // check if otp supplied by user is same as in db
//   if (otp !== user?.otp?.otp) {
//     return false;
//   }

//   let otpExpired = moment().isAfter(user?.otp?.code_expires_at);

//   console.log(`otpExpired: ${otpExpired}`);

//   // check if otp.isValid is true
//   if (otpExpired) {
//     throw new AuthorizationError("Expired OTP");
//   }

//   return true;
// };

// export const checkOtp = async (
//   otp: string,
//   userId: mongoose.Types.ObjectId
// ) => {
//   const adminUser = await AdminUser.findById(userId);

//   if (!adminUser || !adminUser.otp) return false;

//   const expiresAt = new Date(adminUser.otp.expiresAt);
//   const currentTime = new Date();

//   if (currentTime > expiresAt) {
//     return false;
//   }

//   if (otp !== adminUser.otp.otp) {
//     return false;
//   }

//   return true;
// };

// export async function generateJWTToken(
//   payload: any,
//   secret = config.jwt.secret
// ) {
//   return new Promise((resolve, reject) => {
//     jwt.sign(
//       {
//         ...payload,
//       },
//       secret,
//       {},
//       (err, token) => {
//         if (err) {
//           reject(err);
//         }
//         resolve(token);
//       }
//     );
//   });
// }

// export async function decodeToken(token: string) {
//   return new Promise((resolve, reject) => {
//     jwt.verify(token, config.jwt.secret, (err: any, decoded: any) => {
//       if (err) {
//         reject(err);
//       }
//       resolve(decoded);
//     });
//   });
// }

// Calculate the duration in days between start and due dates
export const calculateDurationInDays = async (
	startDate: Date,
	dueDate: Date
): Promise<number> => {
	const startDateTime = startDate.getTime();
	const dueDateTime = dueDate.getTime();
	const differenceInDays = Math.abs(
		Math.ceil(
			(dueDateTime - startDateTime) / (1000 * 60 * 60 * 24)
		)
	);
	return differenceInDays;
};

// Calculate the savings amount based on frequency
export const calculateSavingsAmount = async (
	targetAmount: number,
	durationInDays: number,
	frequency: string
): Promise<number> => {
	let savingsAmount = 0;

	switch (frequency) {
		case "daily":
			savingsAmount = Math.round(
				targetAmount / durationInDays
			);
			break;
		case "weekly":
			savingsAmount =
				targetAmount / Math.round(durationInDays / 7);
			break;
		case "monthly":
			savingsAmount =
				targetAmount / Math.round(durationInDays / 30);
			break;
		case "yearly":
			savingsAmount =
				targetAmount / Math.round(durationInDays / 365);
			break;
		default:
			throw new Error("Invalid savings frequency");
	}

	return Number(Math.ceil(savingsAmount));
};

export const setReminderDate = async (
	startDate: Date,
	frequency: string
) => {
	const start = new Date(startDate);

	let reminderDate;

	switch (frequency) {
		case "daily":
			reminderDate = new Date(
				start.getFullYear(),
				start.getMonth(),
				start.getDate() + 1
			);
			break;
		case "weekly":
			reminderDate = new Date(
				start.getFullYear(),
				start.getMonth(),
				start.getDate() + 7
			);
			break;
		case "monthly":
			reminderDate = new Date(
				start.getFullYear(),
				start.getMonth() + 1,
				start.getDate()
			);
			break;
		case "yearly":
			reminderDate = new Date(
				start.getFullYear() + 1,
				start.getMonth(),
				start.getDate()
			);
			break;
		default:
			throw new Error("Invalid frequency");
	}

	return reminderDate;
};

export const calculateProfileCompletion = async (
	...args: boolean[]
): Promise<string> => {
	const percentagePerParam = 25;
	let totalPercentage = 0;
	args.forEach((arg) => {
		if (arg === true) {
			totalPercentage += percentagePerParam;
		}
	});

	return totalPercentage.toString() + "%";
};

// export const phoneAndKycVerification = async (
//   userId: string,
//   res: Response
// ) => {
//   // check for user

//   const user = await User.findById(userId);

//   if (!user) {
//     return res.status(404).json({
//       success: false,
//       msg: "User not found",
//     });
//   }

//   // checking for phone verfication
//   if (!user.phoneVerified) {
//     return res.status(404).json({
//       success: false,
//       msg: "Phone number not verified",
//     });
//   }

//   // checking kyc completion
//   if (!user.kycComplete) {
//     return res.status(404).json({
//       success: false,
//       msg: "KYC not completed",
//     });
//   }

//   return true;
// };

export const createCaseInsensitiveRegExp = (
	text: string
): RegExp => {
	return new RegExp(`^${text}$`, "i");
};

export const generateUniqueReference = (userId) => {
	const timestamp = Date.now().toString(36);
	const randomPart = Math.random()
		.toString(36)
		.substr(2, 5);
	const userPart = userId.slice(-6);
	return `${timestamp}-${userPart}-${randomPart}`;
};

export const formatCurrency = (value) => {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN", // default is 'NGN' changes depending on
		currencyDisplay: "symbol",
	}).format(value);
};

export const highlights = {
	purchase: (item: String, shop: String) =>
		`I just purchased ${item} from ${shop}.`,
	transfer: (amount: String, recipient: String) =>
		`I just transferred ${amount} to ${recipient}`,
	bills: (amount: String, bill: String) =>
		`I just purchased a ${amount} worth of ${bill}`,
};

// Generate highlight
export const generateHighlight = (
	type: string,
	data: any
): string => {
	if (!highlights[type])
		throw new Error("Invalid highlight type");
	return highlights[type](...Object.values(data));
	// return new Intl.NumberFormat("en-NG", {
	//   style: "currency",
	//   currency: "NGN", // default is 'NGN' changes depending on
	//   currencyDisplay: "symbol",
	// }).format(value);
};

export const toTitleCase = (str: string) => {
	return (
		str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
	);
};

export const disputeTimeFrame = 7;

export const calculateDiscountPercentage = (
	productPrice,
	discountAmount
) => {
	if (productPrice <= 0) {
		throw new Error(
			"Invalid input values: Product price must be greater than 0"
		);
	}

	if (
		discountAmount !== undefined &&
		(discountAmount < 0 || discountAmount > productPrice)
	) {
		throw new ValidationError(
			"discountAmount cannot be greater than productPrice"
		);
	}

	const actualDiscountAmount = discountAmount || 0;

	const discountPercentage =
		(actualDiscountAmount / productPrice) * 100;
	return Math.round(discountPercentage * 100) / 100;
};

export const getStatsYear = [
	null,
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

export const getMonthName = (
	monthNumber,
	language = "en"
) => {
	const date = new Date();
	date.setMonth(monthNumber);
	return date.toLocaleString(language, { month: "long" });
};

export const getMonthNumber = (monthName) => {
	const monthNames = {
		January: 0,
		February: 1,
		March: 2,
		April: 3,
		May: 4,
		June: 5,
		July: 6,
		August: 7,
		September: 8,
		October: 9,
		November: 10,
		December: 11,
	};

	return monthNames[monthName];
};

export function formatDateToCustomFormat(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(
		2,
		"0"
	); // Month is zero-based
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(
		2,
		"0"
	);
	const seconds = String(date.getSeconds()).padStart(
		2,
		"0"
	);

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const getUserDetails = async (
	userId: number,
	userService: UserService
) => {
	const user = await checkUserById(userId, userService);
	if (user) {
		return {
			avatar: null,
			name: user.firstName + " " + user.lastName,
			email: user.mobileNumber,
		};
	}
	return {};
};

export const generateTransactionReference = (
	length: number
): string => {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const randomBytes = crypto.randomBytes(length);
	let result = "";
	for (let i = 0; i < length; i++) {
		const randomIndex = randomBytes[i] % characters.length;
		result += characters.charAt(randomIndex);
	}
	return result;
};

export const askChatbot = async (
	question: string
): Promise<string> => {
	const chatbotUrl = process.env.MOTOPAY_CHATBOT_URL;
	try {
		console.log(chatbotUrl);

		const response = await axios.post(
			chatbotUrl,
			{ query: question },
			{
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			}
		);

		console.log("Hello world", response);
		const chatbotOutput: string = response.data;
		console.log("Chatbot response:", chatbotOutput);
		return chatbotOutput;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError;
			console.error(
				"Error while calling the chatbot:",
				axiosError.message
			);
			throw axiosError;
		} else {
			console.error(
				"Unexpected error while calling the chatbot:",
				error
			);
			throw error;
		}
	}
};

export const genProductDesc = async (
	productName: string,
	productCategory: string,
	productSubcategory: string,
	productBrand: string
) => {
	try {
		const url = process.env.GEN_PRODUCT_DESC_URL;
		const queryParams = new URLSearchParams({
			productName,
			productCategory,
			productSubcategory,
			productBrand,
		});

		console.log(queryParams);

		const response = await axios.post(
			`${url}?${queryParams}`
		);
		console.log(response);
		return response.data.shortDescription;
	} catch (e) {
		return e.message;
	}
};

// {
//   id: 15,
//   firstName: 'Bede',
//   lastName: 'Hampo',
//   mobileNumber: '2347065896334',
//   accountNumber: '7065896334',
//   gender: 'Male',
//   tier: 2,
//   ninVerified: false,
//   addressVerificationInitiated: false,
//   addressVerificationResultReceived: false,
//   addressVerified: false,
//   facialVerified: false,
//   proofOfAddressUploaded: false,
//   motopayTag: 'bede_hampo',
//   profilePhotoUrl: null,
//   email: null,
//   bvn: '01234567890',
//   hasShop: true,
//   hasBusiness: false,
//   dob: '1990-10-10',
//   active: true,
//   locked: false,
//   pinSet: true,
//   activated: true,
//   phoneVerified: true,
//   bvnVerified: true
// }

// Notification function
export const notificationService = async (
	sender,
	user,
	subject,
	message
) => {
	const apiUrl = process.env.NOTIFICATION_URL;
	try {
		const notificationData = {
			sender,
			subject,
			message,
			notificationSource: "SHOP",
			// Receiver Data
			recipientPhone: user.mobileNumber,
			recipientEmail: user.email,
			sendSms: user.enableSms,
			sendEmail: user.enableEmail,
			sendPush: user.enablePushNotifications,
		};

		const response = await axios.post(
			apiUrl,
			notificationData,
			{
				headers: {
					"Content-Type": "application/json",
					accept: "*/*",
				},
			}
		);
		
		return response.data; // Return the response data if needed
	} catch (error) {
		// console.log(error);
	}
};

export const sendRecovaMandateRequest = async (
	sender,
	user,
	subject,
	message
) => {
	const apiUrl = process.env.NOTIFICATION_URL;
	try {
		const notificationData = {
			sender,
			subject,
			message,
			notificationSource: "SHOP",
			// Receiver Data
			recipientPhone: user.mobileNumber,
			recipientEmail: user.email,
			sendSms: true,
			sendEmail: true,
			sendPush: false,
		};

		const response = await axios.post(
			apiUrl,
			notificationData,
			{
				headers: {
					"Content-Type": "application/json",
					accept: "*/*",
				},
			}
		);
		// console.log(
		// 	"Notification sent successfully!",
		// 	response.data
		// );
		return response.data; // Return the response data if needed
	} catch (error) {
		// console.log(error);
	}
};

// Example usage:
const notificationData = {
	sender: "07068551023",
};

// export const sendEmailNotification = async (
// 	subject,
// 	message,
// 	email,
// 	notificationSource,
// 	token
// ) => {
// 	console.log("STARTING POINT");
// 	// Email request url from Notification services
// 	const url =
// 		"https://notificationapp.azurewebsites.net/notification/email";
// 	console.log("url", url);
// 	const defaultValues = {
// 		sendSms: false,
// 		sendEmail: true,
// 		sendPush: false,
// 		templateId: "d-d4f2ddea71b546c59c43d5b389b7b953",
// 	};
// 	console.log("Default values", defaultValues);
// 	const requestBody = {
// 		subject,
// 		message,
// 		email,
// 		notificationSource,
// 		...defaultValues,
// 	};
// 	console.log("Requested body", requestBody);
// 	try {
// 		console.log(token);
// 		const response = await axios.post(url, requestBody, {
// 			headers: {
// 				accept: "*/*",
// 				"Content-Type": "application/json",
// 				'Authorization':`Bearer ${token}`
// 			},
// 		});
// 		console.log("response", response);
// 		console.log("response data", response.data);
// 		return response.data;
// 	} catch (error) {
// 		console.log(error.message, error.response.data);
// 	}
// };

export const sendEmailNotification = async (
	subject,
	message,
	email,
	notificationSource,
	token
) => {
	const url =
		"https://notificationapp.azurewebsites.net/notification/email";

	const defaultValues = {
		sendSms: false,
		sendEmail: true,
		sendPush: false,
		templateId: "d-d4f2ddea71b546c59c43d5b389b7b953",
	};

	const requestBody = {
		subject,
		message,
		email,
		notificationSource,
		...defaultValues,
	};

	const headers = {
		accept: "*/*",
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};

	try {
		const response = await axios.post(url, requestBody, {
			headers,
		});
		return response.data;
	} catch (error) {
		console.error(
			"Error sending email notification:",
			error.message
		);
		if (error.response) {
			console.error(
				"Error response data:",
				error.response.data
			);
		}
		throw error;
	}
};

// export const adminPromotionalEmail = async (
// 	adminProductTag: string
// ) => {
// 	try {
// 		const products = await Product.find({
// 			adminProductTags: adminProductTag,
// 		});
// 		if(products > 0){

// 		}
// 	} catch (error) {
// 		throw error;
// 	}
// };

export const userNotificationInfo = async (userId) => {
	const apiUrl = `http://user.staging-api.motopayng.com/users/refined/${userId}`;
	try {
		const response = await axios.get(apiUrl, {
			headers: {
				accept: "*/*",
			},
		});

		if (response.data.status === "success") {
			return response.data.data;
		} else {
			console.log("The first error");
			throw new Error("Failed to fetch user details");
		}
	} catch (error) {
		console.error("Error fetching user details:", error);
		throw error;
	}
};

export const userNotificationInfoBatch = async (
	userIds: string[]
) => {
	const userDetailsMap = {};
	try {
		// Fetch data for each user in parallel
		const userRequests = userIds.map((userId) =>
			userNotificationInfo(userId)
		);
		const usersData = await Promise.all(userRequests);

		// Map each user's data to their userId
		userIds.forEach((userId, index) => {
			userDetailsMap[userId] = usersData[index];
		});

		return userDetailsMap;
	} catch (error) {
		console.error(
			"Error fetching batch user details:",
			error
		);
		throw error;
	}
};

export const shopTransactionRecords = async (
	accountNum: number,
	token: string
) => {
	const apiUrl = `https://transaction.staging-api.motopayng.com/api/v1/shop/transactions/${accountNum}`;

	try {
		const response = await axios.get(apiUrl, {
			headers: {
				accept: "*/*",
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});
		console.log("Hit here well 1", response.data.data);

		// Check if the response status is success
		if (response.data.status === "Successful") {
			return response.data.data;
		} else {
			console.log("The first error");
			return [];
		}
	} catch (error) {
		// console.error(
		// 	"Error fetching shop transactions:",
		// 	error
		// );
		throw error;
	}
};

export const shopUnsettleTransactions = async (
	accountNum: number,
	token: string
) => {
	const apiUrl = `https://transaction.staging-api.motopayng.com/api/v1/shop/transactions/unsettled/${accountNum}`;

	try {
		const response = await axios.get(apiUrl, {
			headers: {
				accept: "*/*",
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		// Check if the response status is success
		if (response.data.status === "Successful") {
			return response.data.data;
		} else {
			console.log("The first error");
			return [];
		}
	} catch (error) {
		// console.error(
		// 	"Error fetching shop transactions:",
		// 	error
		// );
		throw error;
	}
};

export const shopSettleTransactions = async (
	accountNum: number,
	token: string
) => {
	const apiUrl = `https://transaction.staging-api.motopayng.com/api/v1/shop/transactions/settled/${accountNum}`;

	try {
		const response = await axios.get(apiUrl, {
			headers: {
				accept: "*/*",
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});
		// Check if the response status is success
		if (response.data.status === "Successful") {
			return response.data.data;
		} else {
			console.log("The first error");
			return [];
		}
	} catch (error) {
		console.error(
			"Error fetching shop transactions:",
			error
		);
		throw error;
	}
};

export const getUserTransactions = async (
	accountNum: string,
	token: string,
	pageNo: number,
	pageSize: number
) => {
	const url =
		"https://transaction.staging-api.motopayng.com/api/v1/transactions";
	const data = {
		accountNo: accountNum,
		transactionType: "WALLET_TO_WALLET",
		pageNo: pageNo,
		pageSize: pageSize,
	};

	try {
		const response = await axios.post(url, data, {
			headers: {
				Accept: "*/*",
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});

		if (response.data.status === "Successful") {
			console.log(response.data);
			return response.data;
		} else {
			console.log("Error in response:", response.data);
			return null;
		}
	} catch (error) {
		console.error("Error creating transaction:", error);
		throw error;
	}
};

export const calculatePercentageDifference = async (
	previousCount: number,
	currentCount: number
) => {
	if (previousCount === 0) {
		return currentCount > 0 ? 100 : 0;
	}
	return (
		((currentCount - previousCount) / previousCount) * 100
	);
};

// export const notifyShopperOfNewProductDiscount = async (
// 	productData,
// 	discountRate
// ) => {
// 	try {
// 		const orders = await Order.find({
// 			paymentStatus: OrderPaymentStatus.PAID,
// 		});
// 		for (const order of orders) {
// 			let user;
// 			try {
// 				user = await userNotificationInfo(order.user);
// 				if (!user) {
// 					console.error(
// 						`User with ID ${order.user} does not exist.`
// 					);
// 					continue; // Skip to the next iteration
// 				}
// 			} catch (error) {
// 				console.error(
// 					`Error fetching user details for user ID ${order.user}:`,
// 					error
// 				);
// 				continue; // Skip to the next iteration
// 			}

// 			const msg = `Hi ${user.firstName}\n\nGreat news! A new product has just launched with an exciting discount!\n\nProduct Name: ${productData.productName}\nDiscount Rate: ${discountRate}%\n\nDon’t miss out! Check it out now and explore this limited-time offer.\n\nHappy shopping!`;
// 			await notificationService(
// 				"MotoPay",
// 				user,
// 				"New Product Alert with Discount!",
// 				msg
// 			);
// 		}
// 	} catch (error) {
// 		throw error;
// 	}
// };

export const notifyShopFollowersOfNewProduct = async (
	followers,
	productData,
	shop
) => {
	for (const follower of followers) {
		let user;
		try {
			user = await userNotificationInfo(follower);
			if (!user) {
				console.error("User does not exist");
				continue;
			}
		} catch (error) {
			continue;
		}
		const msgWithDiscount = `Hi ${user.firstName}\n\nGreat news! Your favorite shop, ${shop.brand_name}, has just uploaded a brand-new product!\n\nProduct Name: ${productData.productName}\nDiscount Rate: ${productData.discountRate}%\n\nDon't miss out on this limited-time offer. Visit ${shop.brand_name} now to check out the new addition and save on your purchase!\n\nHappy shopping!`;
		const msg = `Hi ${user.firstName}\n\nWe’re thrilled to announce that ${shop.brand_name} has just uploaded a brand-new product!\n\nProduct Name: ${productData.productName}\n\nBe among the first to explore this latest addition to our collection. Visit ${shop.brand_name} now and discover what makes this product special.\n\nHappy shopping!`;
		const actualMsg = productData.discountRate
			? msgWithDiscount
			: msg;
		await notificationService(
			"MotoPay",
			user,
			"New Product Alert",
			actualMsg
		);
	}
};

export const notifyShopperOfNewProductDiscount = async (
	userId,
	productData,
	discountRate
) => {
	try {
		const orders = await Order.find({
			paymentStatus: OrderPaymentStatus.PAID,
			user: { $ne: userId },
		});
		for (const order of orders) {
			let user;
			try {
				user = await userNotificationInfo(order.user);
				if (!user) {
					console.error("User does not exist");
					continue;
				}
			} catch (error) {
				continue;
			}
			const msg = `Hi ${user.firstName}\n\nGreat news! A new product has just launched with an exciting discount!\n\nProduct Name: ${productData.productName}\nDiscount Rate: ${discountRate}%\n\nDon’t miss out! Check it out now and explore this limited-time offer.\n\nHappy shopping!`;
			await notificationService(
				"MotoPay",
				user,
				"New Product Alert with Discount!",
				msg
			);
		}
	} catch (error) {
		throw error;
	}
};

interface PopulatedCartItem extends Document {
	product: {
		productCategory: Types.ObjectId;
	};
}

interface PopulatedOrder extends Document {
	cartItem: PopulatedCartItem;
	user: number;
}

export const notifyShoppersOfNewSimilarProduct = async (
	userId: number,
	productData: any,
	discountRate: number,
	productCategory: Types.ObjectId
) => {
	try {
		const orders: PopulatedOrder[] = await Order.find({
			paymentStatus: OrderPaymentStatus.PAID,
			user: { $ne: userId },
		}).populate({
			path: "cartItem",
			populate: {
				path: "product",
				select: "productCategory",
			},
		});

		for (const order of orders) {
			let user;
			try {
				user = await userNotificationInfo(order.user);
				if (!user) {
					console.error("User does not exist");
					continue;
				}
			} catch (error) {
				continue;
			}
			const msg = `Hi ${user.firstName},\n\nExciting news! A product you might be interested in has just been uploaded, and it's available at a fantastic discount.\n\nProduct Name: ${productData.productName}\nDiscount Rate: ${discountRate}%\n\nDon’t miss out! Check it out now and take advantage of this limited-time offer.\n\nHappy shopping!`;

			const cartItem = order.cartItem;
			if (cartItem && cartItem.product) {
				const productCategoryFromOrder =
					cartItem.product.productCategory;
				if (
					productCategoryFromOrder.equals(productCategory)
				) {
					// Check if the categories match
					// Send notification logic here
					await notificationService(
						"MotoPay",
						user,
						"New Similar Product Alert with Discount",
						msg
					);
				}
			}
		}
	} catch (error) {
		throw error;
	}
};

export const promotionalProductNotification = async (
	adminProductTag
) => {
	try {
		const products = await Product.find();
		const userIds = new Set();

		// Collect all unique user IDs from product views
		products.forEach((product) => {
			product.views.forEach((userId) =>
				userIds.add(userId)
			);
		});

		// Find the section by tag name
		const section = await AdminProductSectionModel.findOne({
			sectionName: adminProductTag,
		});

		// If no section is found, return early
		if (!section) {
			throw new Error("Admin product section not found");
		}

		// Find products with the specified admin product tag
		const defineProducts = await Product.find({
			adminProductTags: section._id,
		});

		// If there are products with the specified tag, notify the users
		if (defineProducts.length > 0) {
			for (const id of userIds) {
				const user = await userNotificationInfo(id);
				const msg = `Hi ${user.firstName},\n\nExciting news! Festive products you might be interested in are available at fantastic discounts.\n\nDon’t miss out! Check them out now and take advantage of these limited-time offers.\n\nHappy shopping!`;

				await notificationService(
					"MotoPay",
					user,
					"Festive Products Alert",
					msg
				);
			}
		}

		return Array.from(userIds);
	} catch (error) {
		console.error(
			"Error in promotionalProductNotification:",
			error
		);
		throw error;
	}
};

export const analyzeSentiment = async (
	reviews: string[],
	ratings: number[]
) => {
	const url =
		"http://sentimentanalysis.staging-api.motopayng.com/analyze-sentiment/";
	const requestBody = {
		reviews,
		ratings,
	};

	try {
		const response = await axios.post(url, requestBody, {
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});
		console.log("Hello Check end");
		return response.data;
	} catch (error) {
		throw error;
	}
};

export const getTransactionOverview = async (
	token: string
) => {
	try {
		const response = await axios.get(
			"http://transaction.staging-api.motopayng.com/api/v1/transaction-overview",
			{
				headers: {
					accept: "*/*",
					Authorization: `Bearer ${token}`,
				},
			}
		);

		// Return the response data
		return response.data;
	} catch (error) {
		// Handle error
		console.error(
			"Error fetching transaction overview:",
			error
		);
		throw error;
	}
};

// export const calculateBNPLInterest = (
// 	principal,
// 	duration,
// 	frequency
// ) => {
// 	const interestRate = 0.02;
// 	let totalInterest = 0;
// 	const daysInMonth = 30;

// 	if (frequency === "daily") {
// 		totalInterest =
// 			principal *
// 			interestRate *
// 			((duration * daysInMonth) / 7);
// 	} else if (frequency === "weekly") {
// 		totalInterest =
// 			principal * interestRate * (duration * 4);
// 	} else if (frequency === "monthly") {
// 		totalInterest =
// 			principal *
// 			interestRate *
// 			duration *
// 			(daysInMonth / 7);
// 	}

// 	return totalInterest;
// };

export const calculateBNPLInterest = (
	principal: Decimal,
	duration: number
) => {
	const monthlyInterestRate = new Decimal(0.02); // 2% per month
	const totalInterest = principal
		.times(monthlyInterestRate)
		.times(duration);
	return totalInterest.toDecimalPlaces(2);
};

export const generatePaymentBreakDown = (
	totalAmount: Decimal,
	duration: number,
	frequency: string,
	interest: number
) => {
	const paymentBreakDown = [];
	const interval =
		frequency === "daily"
			? 1
			: frequency === "weekly"
			? 7
			: 30;
	const numberOfPayments =
		duration *
		(frequency === "daily"
			? 30
			: frequency === "weekly"
			? 4
			: 1);
	const amountPerPayment = totalAmount.dividedBy(
		numberOfPayments
	);
	let nextDueDate = moment().startOf("day");

	for (let i = 0; i < numberOfPayments; i++) {
		nextDueDate.add(interval, "days");
		paymentBreakDown.push({
			dueDate: nextDueDate.toDate(),
			amount: amountPerPayment
				.toDecimalPlaces(2)
				.toNumber(),
			status: "unpaid",
			interest: (interest / numberOfPayments).toFixed(2),
		});
	}

	return paymentBreakDown;
};

export const getOrderCountdown = async (
	orderId
): Promise<string> => {
	try {
		// Get the order
		const order = await Order.findById(orderId);
		console.log(order);
		const time = order.createdAt;
		// Get the createdAt timestamp
		const currentTime = new Date().getTime();
		const orderCreatedAt = time.getTime();

		// Calculate the elapsed time since the order was created
		const elapsedTime = currentTime - orderCreatedAt;
		const countdownDuration = 5 * 60 * 1000;
		const remainingTime = countdownDuration - elapsedTime;

		// Check if the countdown has elapsed
		if (remainingTime <= 0) {
			// update the order overDue field
			// order.overDueOrder = true;
			await order.save();
			// Send notification message to shop owner
			return "Countdown has elapsed";
		}

		// Convert the remaining time to a more readable format (e.g., minutes and seconds)
		const minutes = Math.floor(remainingTime / 60000);
		const seconds = Math.floor(
			(remainingTime % 60000) / 1000
		);

		return `${minutes} minutes and ${seconds} seconds remaining`;
	} catch (error) {
		console.error("Error in getOrderCountdown:", error);
		throw error;
	}
};

export const getCustomerSegmentData = async (data) => {
	try {
		const response = await axios.post(
			"http://customersegmentation.staging-api.motopayng.com/api/segment/",
			data,
			{
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			}
		);
		return response.data;
	} catch (error) {
		console.error(
			"Error posting customer segment data:",
			error
		);
		throw error;
	}
};

// Function to generate SKU
export const generateUniqueSku = async (
	shopId,
	productName
) => {
	try {
		// Get the shop
		const shop = await Shop.findById({
			_id: shopId,
		});
		if (!shop) throw new Error("Shop not found");

		let sku;
		let isUnique = false;

		while (!isUnique) {
			// Get the first letter of the shop name
			const shopInitial = shop.brand_name
				.charAt(0)
				.toUpperCase();

			// Get the first two letters of the product name
			const productInitials = productName
				.substring(0, 2)
				.toUpperCase();

			// Get the current date in YYYYMMDD format
			const date = new Date();
			const formattedDate = date
				.toISOString()
				.split("T")[0]
				.replace(/-/g, ""); // YYYYMMDD

			// Generate a random part with nanoid (e.g., 4 characters)
			const randomPart = nanoid(4);

			// Assemble the SKU
			sku = `${shopInitial}${productInitials}${formattedDate}${randomPart}`;

			// Ensure SKU does not exceed 12 characters and does not contain spaces
			sku = sku.replace(/\s+/g, ""); // Remove any spaces
			sku = sku.substring(0, 12); // Ensure length does not exceed 12 characters

			// Check if SKU is unique
			const existingProduct = await Product.findOne({
				sku,
			});
			if (!existingProduct) {
				isUnique = true;
			}
		}

		return sku;
	} catch (error) {
		throw error;
	}
};

interface ICountryData {
	name: string;
}

// export const seedCountries = async () => {
// 	try {
// 		// Get countries from the package
// 		const countryNames: string[] = countriesNames.names();

// 		// Clear the country collection
// 		await CountryModel.deleteMany({});

// 		// Create a Set to track unique country names
// 		const uniqueCountries = new Set<string>();

// 		// Prepare country data for insertion, ensuring no duplicates
// 		const countryData: ICountryData[] = countryNames.reduce(
// 			(acc, name) => {
// 				if (!uniqueCountries.has(name)) {
// 					uniqueCountries.add(name);
// 					acc.push({ name });
// 				}
// 				return acc;
// 			},
// 			[] as ICountryData[]
// 		);

// 		// Insert countries into the collection
// 		await CountryModel.insertMany(countryData);

// 		console.log("Countries seeded successfully");
// 	} catch (error) {
// 		console.error("Error seeding countries:", error);
// 	}
// };

export const validatePin = async (
	accountNo: string,
	transactionPin: string,
	token: string
): Promise<any> => {
	const url =
		"https://user.staging-api.motopayng.com/users/validate-pin";

	try {
		const response = await axios.get(url, {
			headers: {
				accept: "*/*",
				accountNo: accountNo,
				transactionPin: transactionPin,
				Authorization: `Bearer ${token}`,
			},
		});

		const data = response.data;

		// { code: '00', description: 'Pin validated successfully' }

		if (data.code === "00") {
			console.log("Pin validated successfully:", data);
		} else {
			console.error("Failed to validate pin:", data);
		}

		return data;
	} catch (error) {
		console.error(
			"Error occurred while validating pin:",
			error
		);
		throw error;
	}
};

// export const updateDocumentIds = async () => {
// 	try {
// 		const orderGroups = await OrderGroup.find({});

// 		for (const order of orderGroups) {
// 			if (mongoose.Types.ObjectId.isValid(order._id)) {
// 				const newId = nanoid();
// 				order._id = newId;
// 				await order.save();
// 				console.log(
// 					`Updated document with new _id: ${newId}`
// 				);
// 			}
// 		}

// 		console.log(
// 			"All documents have been updated with new _id format."
// 		);
// 	} catch (error) {
// 		console.error("Error updating documents:", error);
// 	}
// };
