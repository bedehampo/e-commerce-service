// import { NextFunction, Response } from "express";
// import { CustomRequest } from "../utils/interfaces";
// import { successResponse } from "../helpers";
// import { checkUserById } from "../middlewares/validators";
// import { User } from "../model/User";
// import { LockedFunds } from "../model/budgetWallets/LockedFundsWallets";
// import { MainWallet } from "../model/budgetWallets/MainWallets";


// import { calculateDurationInDays } from "../utils/global";
// import {
// 	AuthorizationError,
// 	ConflictError,
// 	NotFoundError,
// 	ValidationError,
// } from "../errors";

// // Create a lock fund  account
// export const withdrawAndCreateLockedFundAccount = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const id = req.user && req.user.id;
// 		let { title, amount, dueDate, startDate } = req.body;

// 		// Check required fields
// 		if (!title || !amount || !dueDate) {
// 			throw new ValidationError("All fields are required");
// 		}

// 		// Find the user by ID
// 		const user = await User.findById(id);
// 		if (!user) {
// 			throw new NotFoundError("User not found");
// 		}

// 		// Check existing locked fund title
// 		const existingLockedFundTitle =
// 			await LockedFunds.findOne({ title });
// 		if (
// 			existingLockedFundTitle &&
// 			existingLockedFundTitle.status === "active"
// 		) {
// 			throw new ConflictError(
// 				"Locked fund account title already exists and is active"
// 			);
// 		}

// 		// Verify main wallet existence
// 		const mainWallet = await MainWallet.findById(
// 			user.mainWallet
// 		);
// 		if (!mainWallet) {
// 			throw new NotFoundError("Main wallet not found");
// 		}

// 		// Check user's balance
// 		if (mainWallet.balance < amount) {
// 			throw new AuthorizationError("Insufficient balance");
// 		}

// 		// Check minimum amount and duration
// 		if (amount < 1000) {
// 			throw new ValidationError("Minimum amount is 1000");
// 		}
// 		startDate = new Date();
// 		const duration = await calculateDurationInDays(
// 			new Date(startDate),
// 			new Date(dueDate)
// 		);
// 		if (duration < 10) {
// 			throw new ValidationError(
// 				"Minimum duration is 10 days"
// 			);
// 		}

// 		// Check if user has set a pin
// 		if (!user.isSetPin) {
// 			throw new ValidationError("Set pin");
// 		}

// 		// Withdraw from the main wallet
// 		const updatedMainWalletBalance =
// 			mainWallet.balance - amount;
// 		await mainWallet.updateOne({
// 			balance: updatedMainWalletBalance,
// 		});

// 		// Create locked fund account
// 		const lockedFund = new LockedFunds({
// 			userId: user._id,
// 			title,
// 			amount,
// 			dueDate,
// 		});

// 		// Save the locked fund account
// 		await lockedFund.save();

// 		// Add credit transaction to the locked fund account
// 		const transaction = {
// 			type: "credit",
// 			amount,
// 			date: new Date(),
// 		};
// 		lockedFund.transactions.push(transaction);

// 		// Update the user's locked fund array
// 		user.lockedFunds.push(lockedFund._id);

// 		// Save the locked fund again to include the transaction activity
// 		await lockedFund.save();

// 		// Save the user
// 		await user.save();

// 		return res.send(
// 			successResponse(
// 				"Locked fund account created successfully",
// 				lockedFund
// 			)
// 		);
// 	} catch (error: any) {
// 		next(error);
// 	}
// };

// // Get all locked fund accounts - users
// export const getMyLockedFundAccounts = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		// getting the id from the params
// 		const id = req.user && req.user.id;
// 		// checking if the user exists
// 		const user = await User.findById(id).populate(
// 			"lockedFunds"
// 		);
// 		if (!user) {
// 			throw new NotFoundError("user not found");
// 		}

// 		const LockedFunds = user.lockedFunds;
// 		return res.send(
// 			successResponse("locked fund accounts", LockedFunds)
// 		);
// 	} catch (error: any) {
// 		next(error);
// 	}
// };

// // Get a single single locked fund account
// export const getMySingleLockedFund = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		// getting the id from the params
// 		const id = req.user && req.user.id;
// 		await checkUserById(id as string);
// 		const { lockedfundId } = req.params;
// 		const lockedFund = await LockedFunds.findOne({
// 			_id: lockedfundId,
// 			userId: id,
// 		});
// 		if (!lockedFund) {
// 			throw new NotFoundError(
// 				"Locked fund account not found"
// 			);
// 		}
// 		return res.send(
// 			successResponse("locked fund accounts", lockedFund)
// 		);
// 	} catch (error: any) {
// 		next(error);
// 	}
// };

// // Get all locked fund accounts - admin
// export const getAllLockedFunds = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const lockedFunds = await LockedFunds.find().select(
// 			"-createdAt -updatedAt"
// 		);
// 		return res.send(
// 			successResponse("locked fund accounts", lockedFunds)
// 		);
// 	} catch (error: any) {
// 		next(error);
// 	}
// };

// // Top up locked fund account
// export const topUpLockedFundAccount = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const currentUserId = req.user && req.user.id;
// 		const { lockedFundId } = req.params;
// 		const { amount } = req.body;

// 		const user = await checkUserById(
// 			currentUserId as string
// 		);

// 		const mainWallet = await MainWallet.findById(
// 			user.mainWallet
// 		);

// 		if ((mainWallet?.balance as number) < amount) {
// 			throw new AuthorizationError("Insufficient balance");
// 		}

// 		const updatedMainWalletBalance =
// 			(mainWallet?.balance as number) - amount;

// 		const lockedFund = await LockedFunds.findById(
// 			lockedFundId
// 		);

// 		if (!lockedFund) {
// 			throw new NotFoundError(
// 				"Locked fund account not found"
// 			);
// 		}

// 		if (lockedFund.status === "withdrawed") {
// 			throw new Error(
// 				"Locked fund account has been withdrawn"
// 			);
// 		}

// 		if (!user.isSetPin) {
// 			throw new ValidationError("set pin");
// 		}

// 		const updatedLockedFundBalance =
// 			Number(lockedFund.amount) + Number(amount);
// 		await lockedFund.updateOne({
// 			amount: updatedLockedFundBalance,
// 		});

// 		await mainWallet.updateOne({
// 			balance: updatedMainWalletBalance,
// 		});

// 		const updatedLockedFund = await LockedFunds.findOne({
// 			_id: lockedFund._id,
// 		});
// 		const transaction = {
// 			type: "credit",
// 			amount,
// 			date: new Date(),
// 		};
// 		await updatedLockedFund?.transactions.push(transaction);
// 		await updatedLockedFund?.save();

// 		return res.send(
// 			successResponse(
// 				`${amount} has been added to your locked fund account`,
// 				updatedLockedFund
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// // unlocked locked fund account - debug
// export const withdrawLockedFund = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		// Getting the id from the params
// 		const id = req.user && req.user.id;

// 		// Getting the locked fund id from the params
// 		const { lockedFundId } = req.params;

// 		// Getting properties from the body
// 		const { amount } = req.body;
// 		if (!amount) throw new Error("Amount is required");

// 		// Finding the user by id
// 		const user = await checkUserById(id as string);

// 		// Getting the locked fund account
// 		const lockedFund = await LockedFunds.findById(
// 			lockedFundId
// 		);

// 		// checking if the locked fund account exists
// 		if (!lockedFund) {
// 			throw new Error("Locked fund account not found");
// 		}

// 		// Getting the main wallet from the user
// 		const mainWallet = await MainWallet.findById(
// 			user.mainWallet
// 		);

// 		// check if the locked fund account is active
// 		if (lockedFund.status === "withdrawed") {
// 			throw new ConflictError(
// 				"Locked fund account has been withdrawn"
// 			);
// 		}

// 		// ensuring the desired amount to be withdraw is not more than the lockedfund
// 		if (lockedFund.amount < amount) {
// 			throw new AuthorizationError("Insufficient balance");
// 		}

// 		// substrating the desired amount from the locked balance
// 		const newLockedFundBalance =
// 			Number(lockedFund.amount) - Number(amount);

// 		// adding the desired amount to the main wallet balance
// 		const newMainWalletBalance =
// 			Number(mainWallet.balance) + Number(amount);

// 		// Updating the main wallet account
// 		const newMainWallet = await MainWallet.updateOne({
// 			balance: newMainWalletBalance,
// 		});

// 		// updating the locked fund account balance
// 		// Updating the main wallet balance directly and saving it
// 		mainWallet.balance = newMainWalletBalance;
// 		await mainWallet.save();

// 		// updating the locked fund account status
// 		if (Number(amount) === Number(lockedFund.amount)) {
// 			await lockedFund.updateOne({ status: "withdrawed" });
// 		}

// 		const transaction = {
// 			type: "debit",
// 			amount,
// 			date: new Date(),
// 		};
// 		await lockedFund.transactions.push(transaction);
// 		await lockedFund.save();

// 		return res.send(
// 			successResponse(
// 				"You have succesfully withdrawed",
// 				amount
// 			)
// 		);
// 	} catch (error: any) {
// 		next(error);
// 	}
// };
