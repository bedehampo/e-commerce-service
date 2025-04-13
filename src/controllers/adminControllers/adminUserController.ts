// import bcrypt from "bcrypt";
// import { NextFunction, Request, Response } from "express";
// import { AdminUser } from "../../model/admin/adminUser";
// import { successResponse } from "../../helpers/index";
// import validator from "validator";
// import { NotFoundError, ValidationError } from "../../errors";
// import { User } from "../../model/User";
// import { Shop } from "../../model/shop/shop";
// import Loan from "../../model/Loan/Loan";
// import { MainWallet } from "../../model/budgetWallets/MainWallets";
// import { Transactions } from "../../model/Transactions";
// import mongoose from "mongoose";
// import { checkAdminUser } from '../../middlewares/validators';
// import { sendEmail } from "../../services/sendEmail";
// import { checkOtp, generateOtp, generatePassword } from "../../utils/global";
// import { CustomRequest, LoanStatusTypes } from "../../utils/interfaces";
// import { ProcessLoanInput } from "../../validation/loan.schema";
// import { Category } from "../../model/admin/category";

// const isValidMotopayEmail = (email: string) => {
//   const motopayDomain = "motopayng.com";

//   if (!validator.isEmail(email)) {
//     return false;
//   }

//   return email.endsWith(`@${motopayDomain}`);
// };

// export const getSingleUser = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const userId = req.params.id;

//   try {
//     const user = await User.findById(userId)
//       .select("-createdAt -updatedAt -__v -password -otp")
//       .populate("mainWallet")
//       .populate("lockedFunds")
//       .populate("savingTargets")
//       .populate({
//         path: "shop",
//         populate: {
//           path: "category",
//           model: Category,
//         },
//       })
//       .exec();

//     if (!user) {
//       return NotFoundError;
//     }
//     res.send(successResponse("User retrieved successfully", user));
//   } catch (err) {
//     console.log(err);
//     // throw new Error("Server error");
//     next(err);
//   }
// };

// export const getBeneficiaries = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.params.id;

//     const user = await User.findById(userId).populate({
//       path: "beneficiaries",
//       select: "firstName lastName mototag _id",
//     });

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     return res.send(
//       successResponse("Retrieved successfully", user.beneficiaries)
//     );
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// };

// export const createAdminUser = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	const adminId = req.adminUser && req.adminUser._id;
// 	await checkAdminUser(adminId);

//   try {
//     let { passport, firstName, lastName, gender, email, password } = req.body;
//     // if (
//     // 	!passport ||
//     // 	!firstName ||
//     // 	!lastName ||
//     // 	!gender ||
//     // 	!email ||
//     // 	!password
//     // ) {
//     // 	throw new ValidationError("All fields are required");
//     // }
//     const doesEmailExist = await AdminUser.findOne({
//       email,
//     });
//     if (doesEmailExist) throw new ValidationError("Email already exists");
//     const validEmail = isValidMotopayEmail(email);
//     if (!validEmail) throw new ValidationError("Invalid email");

//     // const otp = generateOtp();
//     const otp = "1234";

//     const salt = await bcrypt.genSalt(10);
//     password = await bcrypt.hash(password, salt);
//     const adminUser = new AdminUser({
//       passport,
//       firstName,
//       lastName,
//       gender,
//       email,
//       password,
//       otp: {
//         otp: otp,
//       },
//     });

//     await adminUser.save();

//     const phrase = `Your OTP is ${otp}`;
//     const username = `${firstName} ${lastName}`;
//     const subject = "Motopay Admin User Verification";
//     await sendEmail(email, subject, username, phrase);

//     return res.send(
//       successResponse("Account created successfully", {
//         adminUser,
//       })
//     );
//   } catch (error) {
//     next(error);
//   }
// };

// export const verifyAdminUser = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       throw new ValidationError("Email and OTP are required");
//     }

//     const adminUser = await AdminUser.findOne({
//       email,
//       emailverified: false,
//     });

//     if (!adminUser) {
//       throw new ValidationError("User not found or already verified");
//     }

//     const validOtp = await checkOtp(otp, adminUser._id);

//     if (!validOtp) throw new ValidationError("Invalid OTP");

//     adminUser.emailverified = true;
//     adminUser.status = "verified";
//     await adminUser.save();

//     return res.send(
//       successResponse(
//         "Email verification successful",
//         `Email verified:  ${adminUser.emailverified}`
//       )
//     );
//   } catch (error) {
//     next(error);
//   }
// };

// export const resendOtp = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
//   try {
//     const { email } = req.body;

//     const adminUser = await AdminUser.findOne({ email });

//     if (!adminUser) {
//       throw new ValidationError("User not found");
//     }

//     // const newOtp = generateOtp();
//     const newOtp = "1234";

//     const phrase = `Your OTP is ${newOtp}`;
//     const username = `${adminUser.firstName} ${adminUser.lastName}`;
//     const subject = "Motopay Admin User Verification";
//     await sendEmail(email, subject, username, phrase);

//     adminUser.otp = {
//       otp: newOtp,
//       expiresAt: new Date(Date.now() + 2 * 60 * 1000),
//     };

//     await adminUser.save();

//     return res.send(successResponse("OTP resent successfully", null));
//   } catch (error) {
//     next(error);
//   }
// };

// // suspend user
// export const suspendMotopayUser = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

//     const { userId, adminAction } = req.body;
//     const user = await User.findById(userId);
//     if (!user) throw new ValidationError("User not found");
//     if (user.adminAction.status === "suspend") {
//       throw new ValidationError("Account already suspended");
//     }

// 		const newUser = await User.findByIdAndUpdate(
// 			userId,
// 			{
// 				status: "suspended",
// 				adminAction: {
// 					reason: adminAction.reason,
// 					status: "suspend",
// 					adminUser: adminId,
// 				},
// 			},
// 			{ new: true }
// 		);
// 		await newUser.save();
// 		return res.send(
// 			successResponse("User suspended", newUser)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// // reactivate user
// export const reActivateMotopayUser = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

// 		const { userId, adminAction } = req.body;
// 		const user = await User.findById(userId);
// 		if (!user) throw new ValidationError("User not found");
// 		if (user.adminAction.status === "reactivate") {
// 			throw new ValidationError(
// 				"Account already reactivated"
// 			);
// 		}
// 		const newUser = await User.findByIdAndUpdate(
// 			userId,
// 			{
// 				status: "active",
// 				adminAction: {
// 					reason: adminAction.reason,
// 					status: "reactivate",
// 					adminUser: adminId,
// 				},
// 			},
// 			{ new: true }
// 		);
// 		await newUser.save();
// 		return res.send(
// 			successResponse("User suspended", newUser)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// // suspend shop
// export const suspendShop = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

// 		const { shopId, adminAction } = req.body;
// 		const shop = await Shop.findById(shopId);
// 		if (!shop) throw new ValidationError("Shop not found");
// 		if (shop.adminAction.status === "suspend") {
// 			throw new ValidationError("Shop already suspended");
// 		}
// 		const newShop = await Shop.findByIdAndUpdate(
// 			shopId,
// 			{
// 				status: "suspended",
// 				adminAction: {
// 					reason: adminAction.reason,
// 					status: "suspend",
// 					adminUser: adminId,
// 				},
// 			},
// 			{ new: true }
// 		);
// 		await newShop.save();
// 		return res.send(
// 			successResponse("User suspended", newShop)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// // reactivate shop
// export const reActivateShop = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

// 		const { shopId, adminAction } = req.body;
// 		const shop = await Shop.findById(shopId);
// 		if (!shop) throw new ValidationError("Shop not found");
// 		if (shop.adminAction.status === "reactivate") {
// 			throw new ValidationError("Shop already reactivated");
// 		}
// 		const newShop = await Shop.findByIdAndUpdate(
// 			shopId,
// 			{
// 				status: "active",
// 				adminAction: {
// 					reason: adminAction.reason,
// 					status: "reactivate",
// 					adminUser: adminId,
// 				},
// 			},
// 			{ new: true }
// 		);
// 		await newShop.save();
// 		return res.send(
// 			successResponse("User suspended", newShop)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const processLoanRequest = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
//   const data = req.body;

//   const { loanId, status } = data as ProcessLoanInput["body"];
//   const session = await mongoose.startSession();
//   try {
//     const loan = await Loan.findById(loanId);

//     if (!loan) {
//       throw new ValidationError("Loan not found");
//     }

//     if (status === LoanStatusTypes.APPROVED) {
//       loan.status = LoanStatusTypes.APPROVED;
//       await loan.save();

//       //disburse loan to user

//       const userMainWallet = await MainWallet.findOne({
//         user: loan.user,
//       });

//       if (!userMainWallet) {
//         throw new ValidationError("User wallet not found");
//       }

//       const updateUserMainWallet = await MainWallet.findOneAndUpdate(
//         { user: loan.user },
//         {
//           $inc: {
//             balance: loan.amount,
//           },
//         },
//         { new: true, session }
//       );

//       const transaction = new Transactions({
//         amount: loan.amount,
//         transactionType: "credit",
//         status: "successful",
//         currency: "NGN",
//         sourceWallet: "admin",
//         destinationWallet: "mainWallet",
//         transferChannel: "Moto Transfer",
//         txnDescription: `Loan disbursement for loan Id: ${loan._id} to ${loan.user}`,
//       });

//       await transaction.save({ session });

//       //send notification to user
//     } else if (status === LoanStatusTypes.REJECTED) {
//       loan.status = LoanStatusTypes.REJECTED;
//       await loan.save();

//       //send notification to user
//     }
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     next(error);
//   }
// };

// export const getAllAdminUsers = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

//     const adminUsers = await AdminUser.find({}).select("-password -otp -pin");
//     res.status(200).json({
//       success: true,
//       message: "Admin users retrieved successfully",
//       adminUsers,
//     });
//   } catch (e) {
//     next(e);
//   }
// };

// export const getSingleAdminUsers = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

// 		const { id } = req.params;
// 		const adminUser = await AdminUser.findById(id).select(
// 			"-password -otp -pin"
// 		);
// 		res.status(200).json({
// 			success: true,
// 			message: "Admin users retrieved successfully",
// 			adminUser,
// 		});
// 	} catch (e) {
// 		next(e);
// 	}
// };

// export const changeAdminStatus = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

//     const { status } = req.body;
//     const { id } = req.params;

//     if (status === "verified")
//       throw new ValidationError(
//         "Verification can only be done through company email"
//       );

//     const updatedStatus = await AdminUser.findByIdAndUpdate(
//       id,
//       {
//         status,
//       },
//       { new: true }
//     );
//     await updatedStatus.save();
//     res.status(200).json({
//       success: true,
//       message: "Admin status updated successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const changePassword = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		const user = await checkAdminUser(adminId);

//     const { currentPassword, newPassword } = req.body;


//     const isPasswordValid = await bcrypt.compare(
//       currentPassword,
//       user.password
//     );
//     if (!isPasswordValid) throw new ValidationError("Invalid password");

//     const salt = await bcrypt.genSalt(10);
//     const hashNewPassword = await bcrypt.hash(newPassword, salt);

//     // Update the user password
//     await AdminUser.findByIdAndUpdate(user._id, {
//       $set: {
//         password: hashNewPassword,
//       },
//     });
//     return res.send(successResponse("password changed successfully", null));
//   } catch (error) {
//     next(error);
//   }
// };

// export const forgetPassword = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {

// 		const { email } = req.body;
// 		if (!email) {
// 			throw new ValidationError("Email is required");
// 		}

//     const adminUser = await AdminUser.findOne({ email });

//     if (!adminUser) {
//       throw new ValidationError("Admin user not found");
//     }

//     const newPassword = generatePassword();
//     const hashPassword = await bcrypt.hash(newPassword, 10);
//     adminUser.password = hashPassword;
//     await adminUser.save();

//     const phrase = `Your new Password is ${newPassword} \n Please change your password after login`;
//     const username = `${adminUser.firstName} ${adminUser.lastName}`;
//     const subject = "Motopay Admin User Password Reset";
//     await sendEmail(email, subject, username, phrase);

//     res.send(successResponse("Password reset successfully", newPassword));
//   } catch (error) {
//     next(error);
//   }
// };

// export const updateProfile = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

// 		const { id } = req.params;
// 		const { firstName, lastName, gender, passport } =
// 			req.body;
// 		const adminUser = await AdminUser.findById(id);
// 		if (!adminUser)
// 			throw new ValidationError("Admin user not found");
// 		const updatedProfile =
// 			await AdminUser.findByIdAndUpdate(
// 				id,
// 				{
// 					firstName,
// 					lastName,
// 					gender,
// 					passport,
// 				},
// 				{ new: true }
// 			).select("-password -otp -pin");
// 		await updatedProfile.save();
// 		res.send(
// 			successResponse(
// 				"Profile updated successfully",
// 				updatedProfile
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };
