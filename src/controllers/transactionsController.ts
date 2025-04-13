// import { NextFunction, Response } from "express";
// import { NotFoundError,ValidationError } from "../errors";
// import { successResponse } from "../helpers";
// import { checkUserById } from "../middlewares/validators";
// import { Transactions } from "../model/Transactions";
// import { User } from "../model/User";
// import { MainWallet } from "../model/budgetWallets/MainWallets";
// import { CustomRequest } from "../utils/interfaces";
// import { LockedFunds } from '../model/budgetWallets/LockedFundsWallets';
// import { SavingTargets } from '../model/budgetWallets/SavingTarget';
// import mongoose from "mongoose";
// import { ConflictError, ServiceError } from "../errors";
// import { sendMessage } from "../services/sendMessage";
// import { formatCurrency } from "../utils/global";

// export const getAllTransactions = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		const user = await checkUserById(userId as string);
// 		if (!user) {
// 			throw new NotFoundError("User not found");
// 		}
// 		const transactions = await Transactions.find();
// 		return res.send(
// 			successResponse(
// 				"Transactions fetched successfully",
// 				transactions
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const getTransactionById = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const txnId = req.params.id;

// 		const transaction = await Transactions.findById(txnId)
//       .select("_id txnFee amount totalDebit description status transferChannel")
//       .populate("receiver", "firstName lastName _id mototag");

// 		if (!transaction) {
// 			throw new NotFoundError("Transaction not found");
// 		}

// 		return res.send(
// 			successResponse(
// 				"Transaction fetched successfully",
// 				transaction
// 			)
// 		);
// 	} catch (err) {
// 		console.error(err.message);
// 		next(err);
// 	}
// };

// export const initiateTransaction = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const {
// 			amount,
// 			saveBeneficiary,
// 			description,
// 			receiverUserId,
// 		} = req.body;

// 		const userId = req.user && req.user.id;

// 		const sender = await User.findById(userId);

// 		if (!sender) {
// 			throw new NotFoundError("Sender not found");
// 		}

// 		// check for existing txn
// 		const existingTxn = await Transactions.findOne({
// 			user: userId,
// 			amount,
// 			receiver: receiverUserId,
// 		});

// 		if (existingTxn && existingTxn.status === 'pending') {
// 			throw new ConflictError("Complete the pending transaction first");
// 		}

// 		// KYC and phone verification checks
// 		if (!sender.kycComplete || !sender.phoneVerified) {
// 			throw new ServiceError(
// 				"Sender's KYC or Phone Verification is not completed"
// 			);
// 		}

// 		let receiver = await User.findById(receiverUserId);
// 		if (!receiver) {
// 			throw new NotFoundError("Receiver user not found");
// 		}

// 		// check if receiver has set mototag
// 		if (
// 			receiver.mototag === null ||
// 			receiver.mototag === ""
// 		) {
// 			throw new ServiceError(
// 				"Receiver has not set mototag"
// 			);
// 		}

// 		let senderMainWallet = await MainWallet.findOne({
// 			userId: userId,
// 		});
// 		if (!senderMainWallet) {
// 			throw new NotFoundError(
// 				"Sender MainWallet not found"
// 			);
// 		}

// 		let receiverMainWallet = await MainWallet.findOne({
// 			userId: receiverUserId,
// 		});

// 		if (!receiverMainWallet) {
// 			throw new NotFoundError(
// 				"Receiver MainWallet not found"
// 			);
// 		}

// 		let senderWalletBalance = senderMainWallet.balance;

// 		if (amount > senderWalletBalance) {
// 			throw new ServiceError("Insufficient balance");
// 		}

// 		let senderSpendLimit = senderMainWallet?.spendLimit
// 			?.amount as number;

// 		if (
// 			senderSpendLimit !== null &&
// 			amount > senderSpendLimit
// 		) {
// 			throw new ServiceError(
// 				`${formatCurrency(amount)} transfer amount is more than ${formatCurrency(senderSpendLimit)} spend limit`
// 			);
// 		}

// 		// Create a transaction
// 		const newTransaction = new Transactions({
// 			transactionType: "debit",
// 			currency: "NGN",
// 			sourceWallet: "mainWallet",
// 			destinationWallet: "mainWallet",
// 			transferChannel: "Moto Transfer",
// 			status: "pending",
// 			amount: amount,
// 			description,
// 			user: sender._id,
// 			receiver: receiver._id,
// 		});

// 		await newTransaction.save();

// 		if (saveBeneficiary) {
// 			if (!sender.beneficiaries.includes(receiver._id)) {
// 				sender.beneficiaries.push(receiver._id);
// 				await sender.save();
// 			}
// 		}

// 		return res.send(
// 			successResponse("Transfer initiated", {
// 				txnId: newTransaction._id,
// 			})
// 		);
// 	} catch (err) {
// 		console.error(err);
// 		next(err);
// 	}
// };

// export const completeMotoTransfer = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	const userId = req.user && req.user.id;
// 	const { txnId, pin } = req.body;

// 	const session = await mongoose.startSession();

// 	try {
// 		session.startTransaction();

// 		// Check for existing transactionId to ensure idempotency
// 		const existingTxn = await Transactions.findById(txnId);

// 		if (!existingTxn) {
// 			throw new NotFoundError("Transaction not found");
// 		}

// 		// if transaction is processed already
// 		if (existingTxn.status === "successful") {
// 			throw new ConflictError(
// 				"This transaction has already been processed"
// 			);
// 		}

// 		const { amount, user, receiver, description } =
// 			existingTxn;

// 		// Sender
// 		let sender = await User.findById(user._id);
// 		if (!sender) {
// 			throw new NotFoundError("Sender not found");
// 		}

// 		// Receiver
// 		let existingReceiver = await User.findById(
// 			receiver._id
// 		);
// 		if (!existingReceiver) {
// 			throw new NotFoundError("Receiver user not found");
// 		}

// 		// Sender main wallet
// 		let senderMainWallet = await MainWallet.findOne({
// 			userId: userId,
// 		});
// 		if (!senderMainWallet) {
// 			throw new NotFoundError(
// 				"Sender MainWallet not found"
// 			);
// 		}

// 		// Receiver main wallet
// 		let receiverMainWallet = await MainWallet.findOne({
// 			userId: existingReceiver._id,
// 		});

// 		if (!receiverMainWallet) {
// 			throw new NotFoundError(
// 				"Receiver MainWallet not found"
// 			);
// 		}

// 		let senderWalletBalance = senderMainWallet.balance;

// 		if (amount > senderWalletBalance) {
// 			throw new ServiceError("Insufficient balance");
// 		}

// 		let senderSpendLimit = senderMainWallet?.spendLimit
// 			?.amount as number;

// 		if (
// 			senderSpendLimit !== null &&
// 			amount > senderSpendLimit
// 		) {
// 			throw new ServiceError(
// 				`${amount} transfer amount is more than ${senderSpendLimit} spend limit`
// 			);
// 		}
		
// 		// Check if user has set transfer pin
// 		if (!sender.pin) {
// 			throw new ServiceError(
// 				"You have not set a transfer pin"
// 			);
// 		}

// 		// Check if pin is supplied
// 		if (!pin) {
// 			throw new ServiceError("Pin is required");
// 		}

// 		// Check if user pin matches what's on record
// 		if (sender.pin !== pin) {
// 			throw new ServiceError("Incorrect pin");
// 		}

// 		// Update using $inc to handle race conditions
// 		await MainWallet.updateOne(
// 			{ userId: sender._id },
// 			{ $inc: { balance: -amount } },
// 			{ session }
// 		);

// 		await MainWallet.updateOne(
// 			{ userId: receiver._id },
// 			{ $inc: { balance: amount } },
// 			{ session }
// 		);

// 		// Store the transaction using the providfed transactionId
// 		const senderTransaction = new Transactions({
// 			transactionType: "debit",
// 			currency: "NGN",
// 			sourceWallet: "mainWallet",
// 			destinationWallet: "mainWallet",
// 			transferChannel: "Moto Transfer",
// 			status: "successful",
// 			amount: amount,
// 			description,
// 			txnDesc: `Transaction of ${formatCurrency(
// 				amount
// 			)} to ${existingReceiver.firstName} ${
// 				existingReceiver.lastName
// 			}`,
// 			user: sender._id,
// 		});

// 		await senderTransaction
// 			.save({ session });

// 		let formattedAmount = formatCurrency(amount);

// 		const receiverTransaction = new Transactions({
// 			transactionType: "credit",
// 			currency: "NGN",
// 			sourceWallet: "mainWallet",
// 			destinationWallet: "mainWallet",
// 			transferChannel: "Moto Transfer",
// 			status: "successful",
// 			amount,
// 			description,
// 			txnDesc: `Transaction of ${formattedAmount} from ${sender.firstName} ${sender.lastName}`,
// 			user: receiver._id,
// 		});

// 		await receiverTransaction
// 			.save
// 			// { session }
// 			();

// 		// Send messages
// 		try {
// 			await sendMessage(
// 				sender.phoneNumber.number,
// 				`You've successfully transferred ${formattedAmount} to ${
// 					existingReceiver.firstName
// 				} ${
// 					existingReceiver.lastName
// 				}. Your new balance is ${formatCurrency(
// 					senderMainWallet.balance - amount
// 				)}.`
// 			);
// 		} catch (err) {
// 			console.error(err.message);
// 			next(err);
// 		}

// 		try {
// 			await sendMessage(
// 				existingReceiver.phoneNumber.number,
// 				`You've received ${formattedAmount} from ${
// 					sender.firstName
// 				} ${
// 					sender.lastName
// 				}. Your new balance is ${formatCurrency(
// 					receiverMainWallet.balance + amount
// 				)}.`
// 			); 
// 		} catch (err) {
// 			console.error(err.message);
// 			next(err);
// 		}

// 		await session.commitTransaction();
// 		session.endSession();

// 		return res.send(
// 			successResponse("Transaction successful", {})
// 		);
// 	} catch (err) {
// 		await session.abortTransaction();
// 		session.endSession();
// 		console.error(err);
// 		next(err);
// 	}
// };


// export const getSavingTargetsandLockedFunds = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		const user = await User.findById(userId);

// 		if (!user) {
// 			throw new NotFoundError("User not found");
// 		}
// 		const { order } = req.query;

// 		const savingTargetsFilter = {
// 			_id: { $in: user.savingTargets },
// 		};
// 		const lockedFundsFilter = {
// 			_id: { $in: user.lockedFunds },
// 		};

// 		const savingTargets = await SavingTargets.find(
// 			savingTargetsFilter
// 		).sort({
// 			createdAt: order === "asc" ? 1 : -1,
// 		});
// 		const lockedFunds = await LockedFunds.find(
// 			lockedFundsFilter
// 		).sort({
// 			createdAt: order === "asc" ? 1 : -1,
// 		});

// 		const allAccounts = [...savingTargets, ...lockedFunds];

// 		return res.send(
// 			successResponse("All accounts", allAccounts)
// 		);
// 	} catch (error: any) {
// 		next(error);
// 	}
// };




// export const generateReceipt = async (req: CustomRequest, res: Response, next: NextFunction) => {
// 	try {
// 		const { txnId } = req.body;

// 		const transaction = (await Transactions.findById(txnId)).populated('receiver');

// 		if (!txnId) {
// 			throw new ServiceError("TransactionId is required");
// 		};

// 		const receipt = {

// 		}

// 		return res.send(successResponse("Receipt generated successfully", transaction));
// 	} catch (err) {
// 		console.error(err.message);
// 		next(err);
// 	}
// }
