// import { NextFunction, Response } from "express";
// import {
//   SavingTargets,
//   SavingsTargetStatus,
// } from "../model/budgetWallets/SavingTarget";
// import { MainWallet } from "../model/budgetWallets/MainWallets";
// import { CustomRequest } from "../utils/interfaces";
// import { checkUserById } from "../middlewares/validators";
// import {
//   calculateDurationInDays,
//   calculateSavingsAmount,
//   setReminderDate,
// } from "../utils/global";
// import { successResponse } from "../helpers";
// import {
//   ConflictError,
//   NotFoundError,
//   ServiceError,
//   ValidationError,
// } from "../errors";
// import { CreateSavingTargetInput } from "../validation/savingtarget.schema";

// // // Create a saving target account
// export const createSavingTarget = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;
//     const userService = req.userService;
//     await checkUserById(userId, userService);

//     // getting the properties from the user
//     let {
//       title,
//       targetAmount,
//       startDate,
//       dueDate,
//       reminderDate,
//       category,
//       frequency,
//       setBudget,
//       automateSaving,
//       balance,
//     } = req.body as CreateSavingTargetInput["body"];

//     // checking for existing locked fund title
//     let existingSavingTargetTitle = await SavingTargets.findOne({ title });
//     if (
//       existingSavingTargetTitle &&
//       (existingSavingTargetTitle.status === "active" ||
//         existingSavingTargetTitle.status === "pending")
//     ) {
//       throw new ConflictError("Saving target account title already exists");
//     }

//     // ensuring the duration between the start date and due date is more than 7 days
//     const duration = await calculateDurationInDays(
//       new Date(startDate),
//       new Date(dueDate)
//     );

//     if (duration < 7) {
//       throw new ServiceError("minimum duration is 7 days(1 week)");
//     }

//     // calculating the set budget for the saving target
//     setBudget = await calculateSavingsAmount(targetAmount, duration, frequency);

//     // setting the reminder date
//     reminderDate = await setReminderDate(startDate, frequency);

//     balance = targetAmount;

//     // creating the savingTarget
//     const savingTarget = new SavingTargets({
//       user: userId,
//       title,
//       targetAmount,
//       startDate,
//       dueDate,
//       reminderDate,
//       category,
//       frequency,
//       setBudget,
//       automateSaving,
//       balance,
//     });

//     // saving the saving target
//     await savingTarget.save();

//     return res.send(
//       successResponse("Saving target created successfully", savingTarget)
//     );
//   } catch (error: any) {
//     next(error);
//   }
// };

// // manually fund a saving target account
// export const manualTopUpSavingTarget = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // getting the id from auth token
//     const userId = req.user && req.user.id;

//     // getting the saving target id from the params
//     const { savingTargetId } = req.params;
//     // finding the user by id
//     const userService = req.userService;
//     const user = await checkUserById(userId, userService);
//     // getting params from the body
//     const { amount } = req.body;
//     // ensuring that the amount is present
//     if (!amount) {
//       throw new ValidationError("amount is required");
//     }
//     // checking if the user has a main wallet
//     // const mainWallet = await MainWallet.findById(
//     // 	user.mainWallet
//     // );

//     // if (!mainWallet) {
//     // 	throw new NotFoundError("main wallet not found");
//     // }
//     // // checking if the user has enough balance to fund the saving target
//     // if (mainWallet.balance < amount) {
//     // 	throw new ConflictError("insufficient balance");
//     // }
//     // checking if the amount is greater than 0
//     if (amount < 0) {
//       throw new ValidationError("amount must be greater than 0");
//     }

//     // updating the saving target
//     const savingTarget = await SavingTargets.findById(savingTargetId);

//     if (!savingTarget) throw new NotFoundError("saving target not found");
//     // ensuring the saving target  is not withdrawed
//     if (savingTarget.status === "withdrawed") {
//       throw new ConflictError("saving target has been withdrawed");
//     }
//     // ensuring that saving target has not reached its target amount
//     if (savingTarget.amount === savingTarget.targetAmount) {
//       throw new ConflictError("saving target has reached its target amount");
//     }

//     // // withdrawing from the main wallet
//     // const newBalance =
//     // 	Number(mainWallet.balance) - Number(amount);
//     // // updating the main wallet
//     // await mainWallet.updateOne({ balance: newBalance });

//     // updating the saving target amount
//     const newAmount = Number(savingTarget.amount) + Number(amount);
//     const savingTargetNewBalance =
//       Number(savingTarget.balance) - Number(amount);

//     const updatesavingTarget = await SavingTargets.findByIdAndUpdate(
//       savingTargetId,
//       {
//         amount: newAmount,
//         balance: savingTargetNewBalance,
//         status: "active",
//       },
//       {
//         new: true,
//       }
//     );

//     const transaction = {
//       type: "credit",
//       amount,
//       date: new Date(),
//     };
//     await updatesavingTarget.transactions.push(transaction);
//     await updatesavingTarget.save();

//     return res.send(
//       successResponse("saving target funded successfully", updatesavingTarget)
//     );
//   } catch (error: any) {
//     next(error);
//   }
// };

// // automate funding for a saving target account
// export const automaticTopUpSavingTarget = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // getting the id from the params
//     const userId = req.user && req.user.id;

//     // getting the saving target id from the params
//     const { savingTargetId } = req.params;
//     // finding the user by id
//     const userService = req.userService;
//     const user = await checkUserById(userId, userService);
//     // getting   the particular saving target wallet
//     const savingTarget = await SavingTargets.findById(savingTargetId);

//     // checking the saving method
//     if (savingTarget?.automateSaving !== true)
//       throw new Error("saving method is not automated");
//     // checking if it exists
//     if (!savingTarget) throw new NotFoundError("saving target not found");
//     // checking if the user has a main wallet
//     // const mainWallet = await MainWallet.findById(
//     // 	user.mainWallet
//     // );

//     // if (!mainWallet) {
//     // 	throw new NotFoundError("main wallet not found");
//     // }
//     // // checking if the user has enough balance to fund the saving target
//     // if (mainWallet.balance < savingTarget.setBudget) {
//     // 	throw new ConflictError("insufficient balance");
//     // }

//     // ensuring the saving target  is not withdrawed
//     if (savingTarget.status === SavingsTargetStatus.WITHDREW) {
//       throw new ConflictError("saving target has been withdrawed");
//     }
//     // ensuring that saving target has not reached its target amount
//     if (savingTarget.amount === savingTarget.targetAmount) {
//       throw new ConflictError("saving target has reached its target amount");
//     }
//     // // withdrawing from the main wallet
//     // const newBalance =
//     // 	Number(mainWallet.balance) -
//     // 	Number(savingTarget.setBudget);
//     // // updating the main wallet
//     // await mainWallet.updateOne({ balance: newBalance });

//     // updating the saving target amount
//     const newAmount =
//       Number(savingTarget.amount) + Number(savingTarget.setBudget);
//     const savingTargetNewBalance =
//       Number(savingTarget.balance) - Number(savingTarget.setBudget);

//     const updatesavingTarget = await SavingTargets.findByIdAndUpdate(
//       savingTargetId,
//       {
//         amount: newAmount,
//         balance: savingTargetNewBalance,
//         status: "active",
//       },
//       {
//         new: true,
//       }
//     );
//     const transaction = {
//       type: "credit",
//       amount: savingTarget.setBudget,
//       date: new Date(),
//     };
//     await updatesavingTarget.transactions.push(transaction);
//     await updatesavingTarget.save();

//     return res.send(
//       successResponse(
//         `You have successfully topped up your saving target wallet ${savingTarget.setBudget}`,
//         updatesavingTarget
//       )
//     );
//   } catch (error: any) {
//     next(error);
//   }
// };

// // withdraw from a saving target account
// export const withdrawFromSavingTarget = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // getting the id from the params
//     const id = req.user && req.user.id;

//     // getting the saving target id from the params
//     const { savingTargetId } = req.params;
//     const { amount } = req.body;
//     // finding the user by id

//     const userService = req.userService;
//     const user = await checkUserById(id, userService);
//     // getting   the particular saving target wallet
//     const savingTarget = await SavingTargets.findById(savingTargetId);

//     // checking if it exists
//     if (!savingTarget) throw new NotFoundError("saving target not found");
//     // checking if the user has a main wallet
//     // const mainWallet = await MainWallet.findById(
//     // 	user.mainWallet
//     // );

//     // if (!mainWallet) {
//     // 	throw new NotFoundError("main wallet not found");
//     // }
//     // checking if the user has reach the the target amount
//     // if (savingTarget.targetAmount !== savingTarget.amount) {
//     // 	throw new ConflictError(
//     // 		"you have not reached your target amount"
//     // 	);
//     // }

//     // checking if user has enough balance to withdraw
//     if (Number(savingTarget.amount) < Number(amount))
//       throw new ConflictError("insufficient balance");

//     const newAmount = Number(savingTarget.amount) - Number(amount);
//     // updating the main wallet balance
//     // const newMainWalletBalance =
//     // 	Number(mainWallet.balance) +
//     // 	Number(savingTarget.amount);
//     // await mainWallet.updateOne({
//     // 	balance: newMainWalletBalance,
//     // });
//     // // updating the saving target wallet

//     const updatesavingTarget = await SavingTargets.findByIdAndUpdate(
//       savingTargetId,
//       {
//         amount: newAmount,
//         status: "withdrawed",
//       },
//       {
//         new: true,
//       }
//     );
//     const transaction = {
//       type: "debit",
//       amount,
//       date: new Date(),
//     };
//     await updatesavingTarget.transactions.push(transaction);
//     await updatesavingTarget.save();

//     return res.send(
//       successResponse(
//         "Saving target wallet widthdrawed successfully",
//         updatesavingTarget
//       )
//     );
//   } catch (error: any) {
//     next(error);
//   }
// };

// // Get all saving target accounts - users
// export const getMySavingTargetAccounts = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // getting the id from the params
//     const userId = req.user && req.user.id;
//     // checking if the user exists
//     // const user = await User.findById(userId).populate(
//     // 	"savingTargets"
//     // );
//     // if (!user) throw new NotFoundError("User not found");
//     // const SavingTargets = user.savingTargets;
//     return res.send(successResponse("saving targets fetched", SavingTargets));
//   } catch (error: any) {
//     next(error);
//   }
// };

// // geting a single saving target account - user
// export const getMySingleSavingTargetAccount = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;
//     const { savingTargetId } = req.params;
//     const userService = req.userService;
//     const user = await checkUserById(userId, userService);
//     const savingTarget = await SavingTargets.findOne({
//       userId: userId,
//       _id: savingTargetId,
//     });
//     return res.send(successResponse("saving target fetched.", savingTarget));
//   } catch (error) {
//     next(error);
//   }
// };

// // Get all saving target accounts - admin
// export const getAllSavingTarget = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const savingTargets = await SavingTargets.find().select(
//       "-createdAt -updatedAt"
//     );

//     return res.send(successResponse("saving targets fetched", savingTargets));
//   } catch (error: any) {
//     next(error);
//   }
// };

// // Get a single saving target account - admin
// export const getSingleSavingTarget = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { savingTargetId } = req.params;
//     const savingTarget = await SavingTargets.findById(savingTargetId).select(
//       "-createdAt -updatedAt"
//     );
//     if (!savingTarget) throw new NotFoundError("saving target not found");

//     return res.send(successResponse("saving target fetched", savingTarget));
//   } catch (error) {
//     next(error);
//   }
// };

// // updating saving target method
// export const updateSavingTargetMethod = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const currentUserId = req.user && req.user.id;
//     const userService = req.userService;
//     await checkUserById(currentUserId, userService);

//     const { savingTargetId } = req.params;
//     const savingTarget = await SavingTargets.findById(savingTargetId);
//     if (!savingTarget) throw new NotFoundError("Saving target not found");

//     // toggle the saving method
//     savingTarget.automateSaving = !savingTarget.automateSaving;
//     await savingTarget.save();
//     return res.send(
//       successResponse(
//         "saving target saving method changed to",
//         savingTarget.automateSaving
//       )
//     );
//   } catch (error) {
//     next(error);
//   }
// };

// // closed saving target account
// export const cancelSavingTarget = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // getting the id from the params
//     const id = req.user && req.user.id;
//     // getting the saving target id from the params
//     const { savingTargetId } = req.params;

//     // finding the user by id

//     const userService = req.userService;
//     const user = await checkUserById(id, userService);
//     // getting   the particular saving target wallet
//     const savingTarget = await SavingTargets.findById(savingTargetId);

//     // checking if it exists
//     if (!savingTarget) throw new NotFoundError("saving target not found");
//     // checking if the user has a main wallet
//     // const mainWallet = await MainWallet.findById(
//     // 	user.mainWallet
//     // );
//     // const destinationOpeningBalance = mainWallet.balance;
//     // if (!mainWallet) {
//     // 	throw new NotFoundError("main wallet not found");
//     // }

//     // withdrawing from the saving target wallet
//     const newAmount = Number(savingTarget.amount) - Number(savingTarget.amount);
//     // updating the main wallet balance
//     // const newMainWalletBalance =
//     //   Number(mainWallet.balance) + Number(savingTarget.amount);
//     // await mainWallet.updateOne({
//     //   balance: newMainWalletBalance,
//     // });
//     // updating the saving target wallet

//     const updatesavingTarget = await SavingTargets.findByIdAndUpdate(
//       savingTargetId,
//       {
//         amount: newAmount,
//         status: "withdrawed",
//         balance: savingTarget.targetAmount,
//       },
//       {
//         new: true,
//       }
//     );
//     const transaction = {
//       type: "debit",
//       amount: savingTarget.amount,
//       date: new Date(),
//     };
//     await updatesavingTarget.transactions.push(transaction);
//     await updatesavingTarget.save();

//     return res.send(
//       successResponse(
//         "Saving target wallet widthdrawed successfully",
//         updatesavingTarget
//       )
//     );
//   } catch (error: any) {
//     next(error);
//   }
// };
