import { NextFunction, Response } from "express";
import axios from "axios";
import {
	CustomRequest,
	LoanStatusTypes,
} from "../utils/interfaces";
import { getUserIdAndUser } from "../services/product/productServices";
import { successResponse } from "../helpers/index";
import LoanEligibility from "../model/Loan/LoanEligibility";
import cron from "node-cron";
import {
	NotFoundError,
	ValidationError,
	ServiceError,
} from "../errors";
import { OrderPaymentGroup } from "../model/shop/OrderPaymentGroup";
import {
	CartItemStatus,
	OrderPaymentStatus,
	OrderPaymentType,
	TransactionDetailsItem,
} from "../types/order";
import { BNPLModel } from "../model/shop/bnpl";
import Loan from "../model/Loan/Loan";
import {
	generatePaymentBreakDown,
	calculateBNPLInterest,
	generateTransactionReference,
	userNotificationInfo,
} from "../utils/global";
import moment from "moment";
import {
	CreateBNPLInput,
	EditBNPLInput,
} from "../validation/order.schema";
import { initiateTransactionCall } from "../services/shop/initiateOrderService";
import mongoose from "mongoose";
import { CartItem } from "../model/shop/cartItem";
// import { TransactionService } from "../lib/transactionService";
// import { TransactionStatusCode } from "../types/transactions";
import { Order } from "../model/shop/order";
import { BNPLItemRecordModel } from "../model/shop/bnplItemRecord";
import { TransactionStatusCode } from "../types/transactions";
import Decimal from "decimal.js";

export const createBNPL = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const {
			orderPaymentGroupId,
			duration,
			frequency,
			signature,
			loanAmount,
		} = req.body as CreateBNPLInput["body"];

		const loan = await Loan.find({
			user: userId,
			status: {
				$in: [
					LoanStatusTypes.APPROVED,
					LoanStatusTypes.DEFAULTED,
				],
			},
		});

		if (loan.length > 0)
			throw new ValidationError(
				"user can't proceed with this option because of your loan status"
			);

		let loanEligibility = await LoanEligibility.findOne({
			user: userId,
		});
		if (!loanEligibility)
			throw new NotFoundError(
				"user has no eligibility profile"
			);

		// Check how much the user need from the eligible fund
		if (loanAmount > loanEligibility.eligibleFunds) {
			throw new ValidationError(
				"loan amount exceed user eligible funds"
			);
		}

		const orderPaymentGroup =
			await OrderPaymentGroup.findOne({
				_id: orderPaymentGroupId,
				paymentType: OrderPaymentType.BUYNOWPAYLATER,
				paymentStatus: "pending",
			});
		if (!orderPaymentGroup)
			throw new NotFoundError(
				"Invalid order payment group"
			);

		// const existingBNPL = await BNPLModel.find({
		// 	user: userId,
		// 	status: "active",
		// });
		// if (existingBNPL.length > 0)
		// 	throw new ValidationError(
		// 		"You still have an incomplete BNPL offer"
		// 	);

		const totalAmount = new Decimal(
			orderPaymentGroup.totalAmount
		);
		const commodityCost = new Decimal(
			orderPaymentGroup.totalAmount
		);

		let bnplData;
		let paymentBreakDown = [];
		let remainingDebt;
		let upFrontPayment;
		let upFrontPercent;
		let motopayPaidAmount;
		let interest;

		if (loanAmount >= totalAmount.toNumber()) {
			upFrontPayment = new Decimal(0);
			upFrontPercent = new Decimal(0);
			motopayPaidAmount = totalAmount;
			interest = calculateBNPLInterest(
				totalAmount,
				duration
			);

			remainingDebt = totalAmount.plus(interest);

			paymentBreakDown = generatePaymentBreakDown(
				remainingDebt,
				duration,
				frequency,
				interest
			);
		} else {
			upFrontPayment = totalAmount.minus(loanAmount);
			upFrontPercent = upFrontPayment
				.dividedBy(totalAmount)
				.times(100);
			motopayPaidAmount = new Decimal(loanAmount);
			interest = calculateBNPLInterest(
				totalAmount,
				duration
			);

			remainingDebt = motopayPaidAmount.plus(interest);

			paymentBreakDown = generatePaymentBreakDown(
				remainingDebt,
				duration,
				frequency,
				interest
			);
		}

		bnplData = {
			user: userId,
			orderIds: orderPaymentGroup.orders,
			orderPaymentGroupId,
			commodityCost: commodityCost
				.toDecimalPlaces(2)
				.toNumber(),
			duration,
			frequency,
			upFrontPayment: upFrontPayment
				.toDecimalPlaces(2)
				.toNumber(),
			upFrontPercent: upFrontPercent
				.toDecimalPlaces(2)
				.toNumber(),
			motopayPaidAmount: motopayPaidAmount
				.toDecimalPlaces(2)
				.toNumber(),
			settledDebt: 0,
			remainingDebt: remainingDebt
				.toDecimalPlaces(2)
				.toNumber(),
			signature,
			status: "pending",
			dueDate: moment().add(duration, "months").toDate(),
			interest: interest.toDecimalPlaces(2).toNumber(),
			paymentBreakDown,
		};

		const bnpl = new BNPLModel(bnplData);
		await bnpl.save();

		return res.send(
			successResponse("BNPL created successfully", bnpl)
		);
	} catch (error) {
		next(error);
	}
};

export const editBNPL = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const id = req.params.id;
		const { duration, frequency, signature, loanAmount } =
			req.body as EditBNPLInput["body"];

		const existingBNPL = await BNPLModel.findOne({
			_id: id,
			user: userId,
			status: "pending",
		});

		if (!existingBNPL) {
			throw new NotFoundError(
				"BNPL offer not found or cannot be edited."
			);
		}

		const loan = await Loan.find({
			user: userId,
			status: {
				$in: [
					LoanStatusTypes.APPROVED,
					LoanStatusTypes.DEFAULTED,
				],
			},
		});

		if (loan.length > 0) {
			throw new ValidationError(
				"User cannot proceed with this option due to loan status."
			);
		}

		const loanEligibility = await LoanEligibility.findOne({
			user: userId,
		});

		if (!loanEligibility) {
			throw new NotFoundError(
				"User has no eligibility profile."
			);
		}

		// Check how much the user need from the eligible fund
		if (loanAmount > loanEligibility.eligibleFunds) {
			throw new ValidationError(
				"loan amount exceed user eligible funds"
			);
		}

		const orderPaymentGroup =
			await OrderPaymentGroup.findOne({
				_id: existingBNPL.orderPaymentGroupId,
				paymentType: OrderPaymentType.BUYNOWPAYLATER,
				paymentStatus: "pending",
			});

		if (!orderPaymentGroup) {
			throw new NotFoundError(
				"Invalid order payment group for BNPL offer."
			);
		}

		const totalAmount = new Decimal(
			orderPaymentGroup.totalAmount
		);
		const commodityCost = new Decimal(
			orderPaymentGroup.totalAmount
		);

		let bnplData;
		let paymentBreakDown = [];
		let remainingDebt;
		let upFrontPayment;
		let upFrontPercent;
		let motopayPaidAmount;
		let interest;

		if (loanAmount >= totalAmount.toNumber()) {
			upFrontPayment = new Decimal(0);
			upFrontPercent = new Decimal(0);
			motopayPaidAmount = totalAmount;

			interest = calculateBNPLInterest(
				totalAmount,
				duration
			);

			remainingDebt = totalAmount.plus(interest);

			paymentBreakDown = generatePaymentBreakDown(
				totalAmount.plus(interest),
				duration,
				frequency,
				interest
			);
		} else {
			upFrontPayment = totalAmount.minus(loanAmount);
			upFrontPercent = upFrontPayment
				.dividedBy(totalAmount)
				.times(100);
			motopayPaidAmount = new Decimal(loanAmount);

			interest = calculateBNPLInterest(
				totalAmount,
				duration
			);

			remainingDebt = motopayPaidAmount.plus(interest);

			paymentBreakDown = generatePaymentBreakDown(
				remainingDebt,
				duration,
				frequency,
				interest
			);
		}

		bnplData = {
			...existingBNPL.toObject(),
			duration,
			frequency,
			upFrontPayment: upFrontPayment
				.toDecimalPlaces(2)
				.toNumber(),
			upFrontPercent: upFrontPercent
				.toDecimalPlaces(2)
				.toNumber(),
			motopayPaidAmount: motopayPaidAmount
				.toDecimalPlaces(2)
				.toNumber(),
			remainingDebt: remainingDebt
				.toDecimalPlaces(2)
				.toNumber(),
			signature,
			dueDate: moment().add(duration, "months").toDate(),
			interest: interest.toDecimalPlaces(2).toNumber(),
			paymentBreakDown,
		};

		const updatedBNPL = await BNPLModel.findByIdAndUpdate(
			id,
			bnplData,
			{ new: true }
		);

		if (!updatedBNPL) {
			throw new NotFoundError(
				"Failed to update BNPL offer."
			);
		}

		return res.send(
			successResponse(
				"BNPL updated successfully",
				updatedBNPL
			)
		);
	} catch (error) {
		next(error);
	}
};

export const viewBNPLSummary = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const id = req.params.id;
		const viewBNPL = await BNPLModel.findOne({
			user: userId,
			_id: id,
			status: "pending",
		});
		if (!viewBNPL)
			throw new NotFoundError(
				"no buy now pay later summary"
			);
		return res.send(
			successResponse(
				"Buy now and pay later summary retrieve successfully",
				viewBNPL
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteBNPLSummaries = async () => {
	try {
		const bnplToDelete = await BNPLModel.deleteMany({
			status: { $in: ["pending", "cancel"] },
		});

		if (!bnplToDelete || bnplToDelete.deletedCount === 0) {
			throw new NotFoundError(
				"No pending or canceled BNPL summaries found to delete."
			);
		}

		return bnplToDelete.deletedCount;
	} catch (error) {
		throw error;
	}
};

export const initiateBNPLPayment = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		const { userId } = await getUserIdAndUser(req);
		const token = req.header("authorization").split(" ")[1];
		const bnplId = req.params.id;
		const transactionPin = req.body.transactionPin;

		const bnpl = await BNPLModel.findOne({
			user: userId,
			_id: bnplId,
			status: "pending",
			signature: true,
		}).session(session);

		if (!bnpl) {
			throw new NotFoundError(
				"Invalid buy now and pay later operation"
			);
		}

		const orderPaymentGroup =
			await OrderPaymentGroup.findOne({
				user: userId,
				_id: bnpl.orderPaymentGroupId,
				paymentType: OrderPaymentType.BUYNOWPAYLATER,
			}).session(session);

		if (!orderPaymentGroup) {
			throw new NotFoundError(
				"Invalid initiate order operation"
			);
		}

		const itemRecords = await BNPLItemRecordModel.findOne({
			orderPaymentGroupId: orderPaymentGroup._id,
			user: userId,
		}).session(session);

		if (!itemRecords) {
			throw new NotFoundError("BNPL Item record not found");
		}

		// Extract only the needed fields from itemRecords.items
		const cleanedItems = itemRecords.items.map((item) => ({
			parentRef: item.parentRef,
			accountNo: item.accountNo,
			itemName: item.itemName,
			shopName: item.shopName,
			amount: item.amount,
			quantity: item.quantity,
			fee: item.fee,
		}));

		const transactionRef =
			await generateTransactionReference(10);

		let response;
		try {
			// Attempt to debit the wallet
			response = await debitWalletBNPL(
				bnpl.commodityCost,
				bnpl.upFrontPayment,
				transactionPin,
				token,
				transactionRef,
				"BNPL First Payment",
				cleanedItems,
				session
			);
		} catch (error) {
			await session.abortTransaction();
			throw error;
		}

		// Check if the debit operation was successful
		if (
			response.code !== TransactionStatusCode.SUCCESSFUL
		) {
			await session.abortTransaction();
			return res.status(400).send({
				message: "Debit operation failed",
				error: response.description,
			});
		}

		console.log(response);

		await Promise.all(
			orderPaymentGroup.orders.map(async (orderId) => {
				const order = await Order.findOne({
					_id: orderId,
				}).session(session);

				if (!order) {
					throw new Error(
						`Order with id ${orderId} not found`
					);
				}

				order.paymentStatus = OrderPaymentStatus.PAID;
				await order.save({ session });

				// Find and update cart items associated with the order
				const cart = await CartItem.findByIdAndUpdate(
					{
						_id: order.cartItem,
					},
					{
						status: CartItemStatus.ORDERED,
					},
					{
						new: true,
						session,
					}
				);

				if (!cart)
					throw new NotFoundError("cart item not found");
			})
		);

		orderPaymentGroup.paymentStatus =
			OrderPaymentStatus.PAID;
		await orderPaymentGroup.save({ session });
		bnpl.status = "active";
		await bnpl.save({ session });
		await session.commitTransaction();

		return res.send(
			successResponse(
				"Buy now pay later initiated successfully",
				{ bnpl, response }
			)
		);
	} catch (error) {
		await session.abortTransaction();
		next(error);
	} finally {
		session.endSession();
	}
};

export const partialBnplPayment = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		const { userId, user } = await getUserIdAndUser(req);
		const token = req.header("authorization").split(" ")[1];
		const bnplId = req.params.id;
		const transactionPin = req.body.transactionPin;
		const bnpl = await BNPLModel.findOne({
			user: userId,
			_id: bnplId,
			status: "active",
			signature: true,
		}).session(session);
		if (!bnpl) {
			throw new Error("BNPL not found or not active");
		}

		// Find the first unpaid payment breakdown
		let firstUnpaidPayment = null;
		for (let i = 0; i < bnpl.paymentBreakDown.length; i++) {
			if (bnpl.paymentBreakDown[i].status === "unpaid") {
				firstUnpaidPayment = bnpl.paymentBreakDown[i];
				break;
			}
		}

		if (!firstUnpaidPayment) {
			throw new Error(
				"No unpaid payments found for the BNPL"
			);
		}

		// Generate transaction reference and update payment details
		const transactionRef =
			await generateTransactionReference(10);

		const payload = {
			parentRef: transactionRef,
			transactionRef: transactionRef,
			phone: user.mobileNumber,
			amount: firstUnpaidPayment.amount,
			userId: userId,
			accountNo: user.accountNumber,
		};

		// Initiate payment from user account
		let response;
		try {
			response = await bnplRepayment(
				payload,
				transactionPin,
				token
			);
		} catch (error) {
			await session.abortTransaction();
			throw error;
		}

		// Check if the debit operation was successful
		if (
			response.code !== TransactionStatusCode.SUCCESSFUL
		) {
			await session.abortTransaction();
			return res.status(400).send({
				message: "Debit operation failed",
				error: response.description,
			});
		}

		const paymentDate = new Date();
		firstUnpaidPayment.status = "paid";
		firstUnpaidPayment.transactionReference =
			transactionRef;
		firstUnpaidPayment.paymentDate = paymentDate;
		firstUnpaidPayment.defaulted = false;

		// Update BNPL details
		bnpl.settledDebt += firstUnpaidPayment.amount;
		bnpl.remainingDebt -= firstUnpaidPayment.amount;
		await bnpl.save({ session });

		// Check if all payments are paid
		const allPaymentsPaid = bnpl.paymentBreakDown.every(
			(payment) => payment.status === "paid"
		);

		// If all payments are paid, update BNPL status to completed
		if (allPaymentsPaid) {
			bnpl.status = "completed";
			await bnpl.save({ session });
		}

		// Commit transaction and send response
		await session.commitTransaction();
		return res.send(
			successResponse("Partial payment made successfully", {
				bnpl,
				transactionRef: response.data.transactionRef,
			})
		);
	} catch (error) {
		await session.abortTransaction();
		next(error);
	} finally {
		session.endSession();
	}
};

export const fullBnplPayment = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		const { userId, user } = await getUserIdAndUser(req);
		const token = req.header("authorization").split(" ")[1];
		const bnplId = req.params.id;
		const transactionPin = req.body.transactionPin;
		const bnpl = await BNPLModel.findOne({
			user: userId,
			_id: bnplId,
			status: "active",
			signature: true,
		}).session(session);
		if (!bnpl) {
			throw new Error("BNPL not found or not active");
		}

		// Calculate total amount to pay (sum of all unpaid payments)
		let totalAmountToPay = 0;
		bnpl.paymentBreakDown.forEach((payment) => {
			if (payment.status === "unpaid") {
				totalAmountToPay += payment.amount;
			}
		});

		if (totalAmountToPay === 0) {
			throw new Error(
				"No unpaid payments found for the BNPL"
			);
		}

		// Initiate payment from user account
		// await debitWalletBNPL(
		// 	totalAmountToPay,
		// 	transactionPin,
		// 	token
		// );

		// Generate transaction reference and update payment details for all unpaid payments
		const transactionRef =
			await generateTransactionReference(10);
		const payload = {
			parentRef: transactionRef,
			transactionRef: transactionRef,
			phone: user.mobileNumber,
			amount: totalAmountToPay,
			userId: userId,
			accountNo: user.accountNumber,
		};

		// Initiate payment from user account
		let response;
		try {
			response = await bnplRepayment(
				payload,
				transactionPin,
				token
			);
		} catch (error) {
			await session.abortTransaction();
			throw error;
		}

		const paymentDate = new Date();
		bnpl.paymentBreakDown.forEach(async (payment) => {
			if (payment.status === "unpaid") {
				payment.status = "paid";
				payment.transactionReference = transactionRef;
				payment.paymentDate = paymentDate;
				payment.defaulted = false;
				await payment.save({ session });
			}
		});
		// Check if the debit operation was successful
		if (
			response.code !== TransactionStatusCode.SUCCESSFUL
		) {
			await session.abortTransaction();
			return res.status(400).send({
				message: "Debit operation failed",
				error: response.description,
			});
		}

		// Update BNPL details
		bnpl.settledDebt += totalAmountToPay;
		bnpl.remainingDebt = 0;
		bnpl.status = "completed";
		await bnpl.save({ session });

		// Commit transaction and send response
		await session.commitTransaction();
		return res.send(
			successResponse("Full payment made successfully", {
				bnpl,
				transactionRef: response.data.transactionRef,
			})
		);
	} catch (error) {
		await session.abortTransaction();
		next(error);
	} finally {
		session.endSession();
	}
};

export const getAllUserBNPL = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);

		// Fetch BNPL records for the user with status "active" or "completed"
		const bnpls = await BNPLModel.find({
			user: userId,
			status: { $in: ["active", "completed"] },
		}).select(
			"createdAt status commodityCost remainingDebt user _id dueDate  orderIds"
		);

		// Populate orders with cartItem images and product details for each BNPL record
		const bnplWithOrders = await Promise.all(
			bnpls.map(async (bnpl) => {
				const orders = await Order.find({
					_id: { $in: bnpl.orderIds },
				}).populate({
					path: "cartItem",
					select: "selectColorImage images",
					populate: {
						path: "product",
						select: "productName productDescription",
					},
				});

				// Extract only images and product details from the populated cartItems
				const ordersWithDetails = orders.map((order) => {
					return {
						//@ts-ignore
						images: order.cartItem.selectColorImage.images,
						product: {
							//@ts-ignore
							productName:order.cartItem.product.productName,
							// @ts-ignore
							productDescription:order.cartItem.product.productDescription,
						},
					};
				});

				return {
					...bnpl.toObject(),
					orders: ordersWithDetails,
				};
			})
		);

		return res.send(
			successResponse(
				"User BNPL records fetched successfully",
				bnplWithOrders
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getUserSingleBNPL = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const bnplId  = req.params.id; 

		// Fetch a single BNPL record for the user with status "active" or "completed"
		const bnpl = await BNPLModel.findOne({
			_id: bnplId,
			user: userId,
			status: { $in: ["active", "completed"] },
		});

		if (!bnpl) throw new NotFoundError("bnpl not found");

		// Populate orders with cartItem images and product details for the BNPL record
		const orders = await Order.find({
			_id: { $in: bnpl.orderIds },
		}).populate({
			path: "cartItem",
			select: "selectColorImage images",
			populate: {
				path: "product",
				select: "productName productDescription",
			},
		});

		// Extract only images and product details from the populated cartItems
		const ordersWithDetails = orders.map((order) => {
			return {
				        //  @ts-ignore
				images: order.cartItem.selectColorImage.images,
				product: {
					             //  @ts-ignore
					productName: order.cartItem.product.productName,
					productDescription://@ts-ignore
						order.cartItem.product.productDescription,
				},
			};
		});

		return res.send(
			successResponse("BNPL record fetched successfully", {
				...bnpl.toObject(),
				orders: ordersWithDetails,
			})
		);
	} catch (error) {
		next(error);
	}
};

async function debitWalletBNPL(
	amount: number,
	amountToDebit: number,
	transactionPin: string,
	accessToken: string,
	transactionRef: string,
	description: string,
	items: Array<{
		parentRef: string;
		accountNo: string;
		itemName: string;
		shopName: string;
		amount: number;
		quantity: number;
		fee: number;
	}>,
	session
): Promise<any> {
	const url =
		"http://transaction.staging-api.motopayng.com/api/v1/bnpl/debit-wallet-bnpl";

	const payload = {
		amount,
		amountToDebit,
		channel: "bnpl",
		transactionRef,
		description,
		fee: 0,
		items: items,
		vendor: "vendor",
	};

	try {
		const response = await axios.post(url, payload, {
			headers: {
				accept: "*/*",
				transactionPin: transactionPin,
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		});
		console.log("Hello world", response);
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			console.log(error.response.status, amountToDebit);
			console.log({
				code: error.response.status,
				description:
					error.response.data.description ||
					"An error occurred",
			});
			return {
				code: error.response.status,
				description:
					error.response.data.description ||
					"An error occurred",
			};
		} else {
			console.log({
				code: error.response.status,
				description:
					error.response.data.description ||
					"An error occurred",
			});
			return {
				code: "Unknown",
				description: "An unknown error occurred",
			};
		}
	}
}

async function bnplRepayment(
	payload,
	transactionPin,
	accessToken
) {
	const url =
		"http://transaction.staging-api.motopayng.com/api/v1/bnpl/repayment";
	const headers = {
		accept: "*/*",
		transactionPin: transactionPin,
		Authorization: `Bearer ${accessToken}`,
	};

	try {
		const response = await axios.post(url, payload, {
			headers,
		});
		return response.data;
	} catch (error) {
		console.error(
			"Error making BNPL repayment request:",
			error
		);
		throw error;
	}
}

async function defaultedBnplWithdrawal(payload) {
	const url =
		"https://transaction.staging-api.motopayng.com/api/v1/bnpl/repayment/background";
	const headers = {
		accept: "*/*",
	};

	try {
		const response = await axios.post(url, payload, {
			headers,
		});
		return response.data;
	} catch (error) {
		console.error(
			"Error making BNPL Background repayment request:",
			error
		);
		throw error;
	}
}

export const checkActiveBNPL = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const bnpl = await BNPLModel.findOne({
			user: userId,
			status: "active",
		});
		let hasActiveBNPL;
		if (!bnpl) {
			hasActiveBNPL = false;
		} else {
			hasActiveBNPL = true;
		}

		return res.send(
			successResponse(
				"Active BNPL fetched successfully",
				hasActiveBNPL
			)
		);
	} catch (error) {
		next(error);
	}
};

// Debit Defaulted BNPL
const checkAndDebitOverduePayments = async () => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		// Get current date and subtract one day
		const currentDate = moment()
			.subtract(1, "days")
			.startOf("day")
			.toDate();

		// Find all active BNPL records
		const activeBNPLs = await BNPLModel.find({
			status: "active",
		}).session(session);

		// Initialize an array to store overdue payments details
		const overduePayments = [];

		// Iterate through each BNPL record
		for (const bnpl of activeBNPLs) {
			// Check each payment breakdown entry
			for (const payment of bnpl.paymentBreakDown) {
				if (
					payment.dueDate < currentDate &&
					payment.status === "unpaid"
				) {
					const getUser = await userNotificationInfo(
						bnpl.user
					);
					const transactionRef =
						await generateTransactionReference(10);
					const parentRef =
						await generateTransactionReference(10);

					// Debit the user account
					const payload = {
						parentRef: parentRef,
						transactionRef: transactionRef,
						phone: getUser.mobileNumber,
						amount: payment.amount,
						userId: bnpl.user,
						accountNo: getUser.accountNumber,
					};

					let debitResult;

					try {
						debitResult = await defaultedBnplWithdrawal(
							payload
						);
					} catch (error) {
						await session.abortTransaction();
						throw error;
					}

					// Check if the debit operation was successful
					if (
						debitResult.code !==
						TransactionStatusCode.SUCCESSFUL
					) {
						await session.abortTransaction();
					}

					// If the debit is successful, update the payment status
					payment.paymentDate = new Date();
					payment.transactionReference = transactionRef;
					payment.status = "paid";
					payment.defaulted = true;

					// Add the payment to the overduePayments array
					overduePayments.push({
						bnplId: bnpl._id,
						paymentId: payment._id,
						dueDate: payment.dueDate,
						amount: payment.amount,
						debited: true,
						transactionReference: transactionRef,
					});
					await bnpl.save({ session });
				}
			}
		}
		await session.commitTransaction();
		return overduePayments;
	} catch (error) {
		await session.abortTransaction();
		console.error(
			"Error checking and debiting overdue payments:",
			error
		);
		throw error;
	} finally {
		session.endSession();
	}
};

cron.schedule("* * * * *", async () => {
	await checkAndDebitOverduePayments();
});
