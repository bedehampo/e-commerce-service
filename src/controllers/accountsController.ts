// import axios, { AxiosRequestConfig } from "axios";
// import { Request, Response, NextFunction } from "express";
// import randomWords from "random-words";
// import * as referralCodes from "referral-codes";
// import config from "../config/index";
// import { User } from "../model/User";
// import { MainWallet } from "../model/budgetWallets/MainWallets";
// import { BusinessWalletType, CustomRequest } from "../utils/interfaces";
// import { NotFoundError } from "../errors";
// import { successResponse } from "../helpers";
// import { BusinessWallet } from "../model/budgetWallets/BusinessWallets";
// import mongoose from "mongoose";

// // TODO:: Change account number generation to interswitch api

// const budpayBaseUrl = config.budPay.baseUrl;
// const budPayTestSecretKey = config.budPay.testSecretKey;

// export const generateAccountDetails = async (userId: string) => {
//   try {
//     const user = await User.findById(userId);

//     const accountName = generateAccountName();
//     const accountNumber = generateAccountNumber();
//     const firstName = accountName.split(" ")[0];
//     const lastName = accountName.split(" ")[1];
//     const email = `${accountName
//       .replace(/\s/g, "")
//       .toLowerCase()}@motopayng.com`;
//     const customerCode = `CUS-${accountNumber}`;
//     const phone = `0${accountNumber}`;

//     let spendLimit: {
//       amount: number | null;
//       frequency: string;
//     } = {
//       amount: null,
//       frequency: "daily",
//     };

//     let mainWallet = new MainWallet({
//       userId,
//       spendLimit,
//       accountDetails: {
//         accountName,
//         accountNumber,
//         customer: {
//           firstName,
//           lastName,
//           email,
//           customerCode,
//           phone,
//         },
//         createdDate: new Date().toDateString(),
//         updatedAt: new Date().toDateString(),
//       },
//     });

//     mainWallet = await mainWallet.save();

//     return mainWallet;
//   } catch (err) {
//     console.error(err);
//   }
// };

// export const generateBusinessAccountDetails = async (
//   user: string,
//   type: BusinessWalletType
// ) => {
//   const accountName = generateAccountName();
//   const accountNumber = generateAccountNumber();
//   const firstName = accountName.split(" ")[0];
//   const lastName = accountName.split(" ")[1];
//   const email = `${accountName.replace(/\s/g, "").toLowerCase()}@motopayng.com`;
//   const customerCode = `CUS-${accountNumber}`;
//   const phone = `0${accountNumber}`;

//   let businessWallet = new BusinessWallet({
//     user,
//     accountDetails: {
//       accountName,
//       accountNumber,
//       customer: {
//         firstName,
//         lastName,
//         email,
//         customerCode,
//         phone,
//       },
//       createdDate: new Date().toDateString(),
//       updatedAt: new Date().toDateString(),
//     },
//     type,
//   });

//   businessWallet = await businessWallet.save();

//   return businessWallet;
// };

// export const listDedicatedCustomers = async (req: Request, res: Response) => {
//   try {
//     const config: AxiosRequestConfig = {
//       headers: {
//         Authorization: `Bearer ${budPayTestSecretKey}`,
//       },
//     };

//     const response = await axios.get(
//       `${budpayBaseUrl}/list_dedicated_accounts`,
//       config
//     );

//     const { data, status, message } = response.data;
//     return res.status(200).json({
//       status,
//       message,
//       data,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).send(err);
//   }
// };

// // Generate random accountName
// const generateAccountName = () => {
//   return randomWords({
//     exactly: 1,
//     wordsPerString: 2,
//   }).toString();
// };

// export const generateAccountNumberBudpay = async (
//   req: Request,
//   res: Response,
//   userId: string
// ) => {
//   try {
//     const config: AxiosRequestConfig = {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.BUDPAY_TEST_SECRET_KEY}`,
//       },
//     };

//     const customer = {
//       customer: userId,
//     };

//     const response = await axios.post(
//       `${budpayBaseUrl}/dedicated_virtual_account`,
//       { customer: userId },
//       config
//     );

//     console.log(req);

//     return res.status(200).json(response);
//   } catch (err) {
//     console.error(err);
//   }
// };

// // Generate AccountNumber
// const generateAccountNumber = () => {
//   return referralCodes
//     .generate({
//       length: 10,
//       count: 1,
//       charset: "0123456789",
//     })
//     .toString();
// };

// // export const generateAccountNumber = async (
// //   req: Request,
// //   res: Response,
// //   userId: string
// // ) => {
// //   console.log(userId);

// //   try {
// //     const config: AxiosRequestConfig = {
// //       headers: {
// //         "Content-Type": "application/json",
// //         Authorization: `Bearer ${process.env.BUDPAY_TEST_SECRET_KEY}`,
// //       },
// //     };

// //     const customer = {
// //       customer: userId,
// //     };

// //     const response = await axios.post(
// //       `${budpayBaseUrl}/dedicated_virtual_account`,
// //       { customer: userId },
// //       config
// //     )

// export const setSpendLimit = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { amount, frequency } = req.body;

//     const userId = req.user && req.user.id;
//     // @ts-ignore
//     let user = await User.findById(userId).populate(
//       "mainWallet",
//       "-createdAt -updatedAt -__v"
//     );

//     // Get user MainWallet
//     let mainWallet = await MainWallet.findOne({
//       userId: user?._id,
//     });

//     if (!mainWallet) {
//       throw new NotFoundError("Main Wallet does not exist");
//     }

//     // Update user spend limit
//     mainWallet = await MainWallet.findByIdAndUpdate(
//       mainWallet._id,
//       {
//         spendLimit: {
//           amount,
//           frequency,
//         },
//       },
//       { new: true }
//     );

//     return res.send(
//       successResponse(
//         "Spend limit updated successfully",
//         mainWallet?.spendLimit
//       )
//     );
//   } catch (err) {
//     next(err);
//   }
// };

// export const resetSpendLimit = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;

//     let user = await User.findById(userId).populate(
//       "mainWallet",
//       "-createdAt -updatedAt -__v"
//     );

//     // Get user MainWallet
//     let mainWallet = await MainWallet.findOne({
//       userId: user?._id,
//     });

//     if (!mainWallet) {
//       throw new NotFoundError("Main Wallet does not exist");
//     }

//     // Update user spend limit
//     mainWallet = await MainWallet.findByIdAndUpdate(
//       mainWallet._id,
//       {
//         spendLimit: {
//           amount: null,
//           frequency: "daily",
//         },
//       },
//       { new: true }
//     );

//     return res.send(
//       successResponse(
//         "Spend limit updated successfully",
//         mainWallet?.spendLimit
//       )
//     );
//   } catch (err) {
//     next(err);
//   }
// };
