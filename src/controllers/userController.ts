// import { NotFound } from "@aws-sdk/client-s3";
// import bcrypt from "bcrypt";
// import { NextFunction, Request, Response } from "express";
// import { validationResult } from "express-validator";
// import parsePhoneNumber from "libphonenumber-js";
// import moment from "moment";
// import qrCode from "qrcode";
// import config from "../config";
// import {
//   AuthenticationError,
//   AuthorizationError,
//   ConflictError,
//   NotFoundError,
//   ServiceError,
//   ValidationError,
// } from "../errors";
// import { successResponse } from "../helpers/index";
// import okraService from "../lib/okra";
// import { User } from "../model/User";
// import { Category } from "../model/admin/category";
// import { MainWallet } from "../model/budgetWallets/MainWallets";
// import { Shop } from "../model/shop/shop";
// import { createAccountSession } from "../services";
// import { sendMessage } from "../services/sendMessage";
// import {
//   calculateProfileCompletion,
//   generateOtp,
//   generateRefCode,
//   phoneAndKycVerification,
//   sendOtp,
//   toTitleCase,
//   validateOtp,
// } from "../utils/global";
// import { CustomRequest } from "../utils/interfaces";
// import {
//   getImageUrl,
//   singleImageUpload,
//   uploadToS3,
// } from "../utils/uploadUtils";
// import { checkUserById } from "./../middlewares/validators";
// import { generateAccountDetails } from "./accountsController";

// import {
//   GetObjectCommand,
//   HeadObjectCommand,
//   ListObjectsV2Command,
//   PutObjectCommand,
//   S3Client,
// } from "@aws-sdk/client-s3";
// import { RecentSearch } from "../model/RecentSearch";
// import { DeactivatedUser } from "../model/DeactivatedUsers";

// // Get all users
// export const getAllUsers = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const users = await User.find()
//       .select("-password -createdAt -updatedAt -__v -pin")
//       .populate("mainWallet")
//       .populate("lockedFunds", "-userId -createdAt -updatedAt -__v");
//     return res.send(successResponse("Users retrieved successfully", users));
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// };

// // Get a single user
// export const getUserByPhone = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { phone } = req.params;

//   try {
//     const user = await User.findOne({
//       "phoneNumber.number": phone,
//     }).select("firstName lastName phoneNumber.number mototag _id");

//     if (!user) {
//       throw new NotFoundError(`User not found with phone number ${phone}`);
//     }

//     if (!user.mototag) {
//       throw new ServiceError("User has not set mototag");
//     }

//     res.send(successResponse("User retrieved successfully", user));
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// };

// export const getUserRecentSearch = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const userId = req.user && req.user.id;

//   try {
//     const user = await User.findById(userId);

//     const userRecentSearches = await RecentSearch.find({
//       user: userId,
//     }).select("query _id user");

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     return res.send(
//       successResponse("Retrieved successfully", userRecentSearches)
//     );
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// };

// export const getSingleUser = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const id = req.params.id;

//   try {
//     const user = await User.findById(id)
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
//     // res.status(200).json(user);
//     res.send(successResponse("User retrieved successfully", user));
//   } catch (err) {
//     console.log(err);
//     // throw new Error("Server error");
//     next(err);
//   }
// };

// // User registration
// export const register = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     let {
//       phoneNumber,
//       password,
//       firstName,
//       lastName,
//       gender,
//       referredById,
//       device_Id,
//     } = req.body;

//     let referredByUser = null;

//     let profilePicture = `${config.uiAvatars.baseUrl}/api?name=${firstName}+${lastName}`;

//     // randomly Generated code
//     const userAgent = req.userAgent && req.userAgent;

//     // const otp = config.env.isProduction
//     // 	? generateOtp()
//     // 	: "1234";
//     const otp = "1234";

//     // Phone number validation
//     const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
//     const isValidPhoneNumber = parsedPhoneNumber && parsedPhoneNumber.isValid();
//     if (isValidPhoneNumber) {
//       // Destructure phoneNumber object from parsedPhoneNumber
//       const { country, countryCallingCode, nationalNumber, number } =
//         parsedPhoneNumber;

//       phoneNumber = {
//         country,
//         countryCallingCode,
//         nationalNumber,
//         number,
//       };

//       // check if user with phone exists
//       let existingUser = await User.findOne({
//         "phoneNumber.number": phoneNumber.number,
//       });

//       if (existingUser) {
//         throw new ConflictError("Registration failed: Phone exists");
//       }

//       const referralExists = await isValidReferral(referredById);
//       // check if user is referred by another user
//       if (referredById) {
//         if (!referralExists) {
//           throw new ValidationError("Invalid referral code");
//         }

//         referredByUser = await User.findOne({
//           referralCode: referredById,
//         });
//       }

//       let referralCode = await generateReferralCode(next);

//       // encrypt password
//       const salt = await bcrypt.genSalt(10);
//       password = await bcrypt.hash(password, salt);

//       // Save user to db
//       let user = new User({
//         firstName: toTitleCase(firstName),
//         lastName: toTitleCase(lastName),
//         gender,
//         phoneNumber,
//         profilePicture,
//         password,
//         referredBy: referredByUser?._id,
//         referralCode,
//         kycComplete: true,
//         otp: {
//           otp: otp,
//           isValid: true,
//         },
//       });

//       user = await user.save();

//       // Send otp to user
//       const msg = `Welcome to Motopay! Use this code ${otp} to complete your registration, code expires in 5 mins.`;

//       const expiresAt = moment().add(5, "minutes");

//       await User.findByIdAndUpdate(user._id, {
//         "otp.otp": otp,
//         "otp.code_expires_at": expiresAt,
//       });

//       // call Message controller to send otp text message to user
//       // await sendMessage(phoneNumber.number, msg);

//       config.env.isProduction
//         ? await sendMessage(phoneNumber.number, msg)
//         : null;

//       // Call Account Module to create default accounts
//       const mainWallet = await generateAccountDetails(user._id.toString());

//       // Update user information with Wallet Id
//       await User.findByIdAndUpdate(
//         user._id,
//         {
//           mainWallet: mainWallet?._id,
//         },
//         { new: true }
//       ).select("-createdAt -updatedAt -userId -password -__v");

//       const userPayload = await User.findById(user._id).select(
//         "-createdAt -updatedAt -password -userId -__v -mainWallet -referredBy"
//       );

//       const { unknownDevice, token } = await createAccountSession(
//         config.env.isProduction ? device_Id : userAgent,
//         user,
//         userAgent as string
//       );

//       return res.send(
//         successResponse("Account created successfully", {
//           token,
//         })
//       );
//     } else {
//       throw new ValidationError("Please enter a valid phone number");
//     }
//   } catch (err) {
//     next(err);
//   }
// };

// // verify user otp and phoneNUmber
// export const completeKyc = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { firstName, lastName, email, dob, gender } = req.body;
//     const { id } = req.params;

//     // checking if user exist
//     const user = await User.findById(id);
//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     // ensuring properties
//     if (!firstName || !lastName || !email || !dob || !gender) {
//       throw new ServiceError("All fields are mandatory");
//     }

//     // check if email is existing
//     const existingEmail = await User.findOne({ email });
//     if (existingEmail) {
//       throw new NotFoundError("Email already exists");
//     }

//     // checking if kyc is updated already
//     if (user.kycComplete !== false) {
//       throw new AuthorizationError("KYC updated already");
//     }

//     if (!user.phoneVerified) {
//       throw new AuthorizationError("User phone number not verified");
//     }

//     await User.findByIdAndUpdate(user._id, {
//       kycComplete: true,
//       firstName,
//       lastName,
//       email,
//       dob,
//       gender,
//     });
//     res.send(successResponse("KYC updated successfully", null));
//   } catch (error) {
//     next(error);
//   }
// };

// // set motoTag
// export const setMototag = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const userId = req.user && req.user.id;
//   try {
//     const { mototag } = req.body;
//     const userId = req.user && req.user.id;
//     // checking if user exist
//     let user = await User.findById(userId);
//     if (!user) {
//       // return res.status(404).json({ success: false, msg: "user not found" });
//       throw new NotFoundError("user not found");
//     }

//     // checking for phone verfication
//     if (!user.phoneVerified) {
//       // return res.status(404).json({
//       //   success: false,
//       //   msg: "Phone number not verified",
//       // });
//       throw new AuthorizationError("Phone number not verified");
//     }

//     // checking kyc completion
//     // if (!user.kycComplete) {
//     // 	throw new NotFoundError("KYC not completed");
//     // }

//     // checking if the mototag esisted
//     const existingMototag = await User.findOne({ mototag });
//     if (existingMototag) {
//       throw new ConflictError("mototag already taken");
//     }

//     // ensuring properties
//     if (!mototag) {
//       throw new ValidationError("empty field not allow");
//     }

//     if (user.phoneVerified === true) {
//       user = await User.findByIdAndUpdate(
//         user._id,
//         {
//           mototag,
//         },
//         {
//           new: true,
//         }
//       );
//     } else {
//       throw new AuthorizationError("user not verified");
//     }
//     res.send(successResponse(`Hello, ${user.mototag}`, null));
//   } catch (error) {
//     next(error);
//   }
// };

// // change password
// export const changePassword = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;
//     // validate request body
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ status: "error", errors: errors.array() });
//     }
//     const { currentPassword, newPassword } = req.body;

//     // Find the user
//     const user = await User.findById(userId);
//     if (!user) {
//       // return res.status(404).json({ success: false, msg: "user not found" });
//       throw new NotFoundError("User not found");
//     }

//     // checking for phone verfication
//     if (!user.phoneVerified) {
//       // return res.status(404).json({
//       //   success: false,
//       //   msg: "Phone number not verified",
//       // });
//       throw new NotFoundError("Phone number not verified");
//     }

//     // checking kyc completion
//     // if (!user.kycComplete) {
//     // 	throw new NotFoundError("KYC not completed");
//     // }

//     // verify the current password
//     const isPasswordValid = await bcrypt.compare(
//       currentPassword,
//       user.password
//     );
//     if (!isPasswordValid) {
//       throw new ValidationError("Invalid password");
//       // return res.status(401).json({ success: false, msg: "invalid password" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashNewPassword = await bcrypt.hash(newPassword, salt);

//     // Update the user password
//     await User.findByIdAndUpdate(user._id, {
//       $set: {
//         password: hashNewPassword,
//       },
//     });

//     // return res
//     //   .status(200)
//     //   .json({ status: "success", message: "password changed successfully" });
//     return res.send(successResponse("password changed successfully", null));
//   } catch (error) {
//     // return res.status(500).json({ success: false, msg: `${error}` });
//     next(error);
//   }
// };

// // Forgot Password
// export const forgetPassword = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // ask a user for their phone number
//     const { phoneNumber } = req.body;

//     // validate properties
//     if (!phoneNumber) {
//       // return res
//       //   .status(404)
//       //   .json({ success: false, msg: "empty field not allow" });
//       throw new NotFoundError("empty field not allow");
//     }

//     // check if user exist
//     const user = await User.findOne({
//       "phoneNumber.number": phoneNumber,
//     });
//     if (!user) {
//       // return res.status(404).json({ success: false, msg: "user not found" });
//       throw new NotFoundError("user not found");
//     }
//     // generate otp
//     // const otp = config.env.isProduction
//     // 	? generateOtp()
//     // 	: "1234";
//     const otp = "1234";

//     // save otp to db
//     await User.findByIdAndUpdate(user._id, {
//       "otp.otp": otp,
//     });
//     // send otp to user
//     // sendMessage(user.phoneNumber.number, otp);
//     await sendMessage(user.phoneNumber.number, otp);

//     return res.send(successResponse("otp sent successfully", null));
//   } catch (error) {
//     // return res.status(500).json({ success: false, msg: `${error}` });
//     next(error);
//   }
// };

// // Reset Forget Password New Password
// export const resetPassword = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // validate request body
//     const { phoneNumber, otp, newPassword } = req.body;
//     if (!phoneNumber || !otp || !newPassword) {
//       return res.status(404).json({
//         status: "error",
//         message: "empty field not allow",
//       });
//     }

//     // check if user exist
//     const user = await User.findOne({
//       "phoneNumber.number": phoneNumber,
//     });
//     if (!user) {
//       throw new NotFoundError("user not found");
//     }
//     // check if otp is valid
//     if (otp !== user?.otp?.otp) {
//       throw new NotFoundError("invalid otp");
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashNewPassword = await bcrypt.hash(newPassword, salt);
//     // Update the user password
//     await User.findByIdAndUpdate(user._id, {
//       password: hashNewPassword,
//     });

//     // return res.status(200).json({
//     //   status: "success",
//     //   message: "Password changed successfully",
//     // });
//     return res.send(successResponse("Password changed successfully", null));
//   } catch (error) {
//     // return res.status(500).json({ success: false, msg: `${error}` });
//     next(error);
//   }
// };

// // Enable Two factor authentication
// export const twoFactorAuth = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;

//     // validate request body
//     const user = await User.findById(userId);
//     if (!user) {
//       // return res.status(404).json({ success: false, msg: "user not found" });
//       throw new NotFoundError("user not found");
//     }

//     // checking for phone verfication
//     if (!user.phoneVerified) {
//       throw new AuthorizationError("Phone number not verified");
//     }

//     // checking kyc completion
//     // if (!user.kycComplete) {
//     // 	throw new NotFoundError("KYC not completed");
//     // }
//     // toggling between enable and disable
//     user.twoFactorEnabled = !user.twoFactorEnabled;
//     await user.save();
//     const action = user.twoFactorEnabled ? "enabled" : "disabled";

//     return res.send(successResponse(`Two factor ${action}`, null));
//   } catch (error) {
//     next(error);
//   }
// };

// // Set Pin
// export const setPin = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     let { userPin } = req.body;

//     const userId = req.user && req.user.id;
//     // get user
//     let user = await User.findById(userId);

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     // check if user has set pin, then advise to update pin
//     if (user.isSetPin === true) {
//       throw new ConflictError("Pin exists, kindly update your PIN");
//     }

//     // ensure that pin is 4 digits
//     if (userPin.length !== 4) throw new ValidationError("Pin must be 4 digits");

//     // encrypt pin
//     // const salt = await bcrypt.genSalt(10);
//     // userPin = await bcrypt.hash(userPin, salt);

//     await User.findByIdAndUpdate(
//       userId,
//       {
//         pin: userPin,
//         isSetPin: true,
//       },
//       {
//         new: true,
//       }
//     ).select("-password -createdAt -updatedAt -__v");

//     return res.send(successResponse("PIN set successfully", null));
//   } catch (err) {
//     console.error(err.message);
//     next(err);
//   }
// };

// // Update Pin
// export const updatePin = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;

//     const { oldPin, newPin } = req.body;
//     let user = await User.findById(userId);

//     // check if user exists
//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     // ensuring the new pin is 4 digits
//     if (newPin.length !== 4) throw new ValidationError("Pin must be 4 digits");

//     // check if oldPin is correct
//     if (oldPin !== user.pin) {
//       return res.status(400).json({
//         status: "error",
//         message: "Please enter your current PIN to continue",
//       });
//     }

//     if (oldPin === newPin) {
//       throw new ConflictError("New PIN shouldn't be the same as the old one");
//     }

//     // const otp = config.env.isProduction ? generateOtp() : "1234";
//     const otp = "1234";

//     // encrypt new pin
//     // const salt = await bcrypt.genSalt(10);
//     // const hashNewPin = await bcrypt.hash(newPin, salt);

//     // save temp pin to db
//     user = await User.findByIdAndUpdate(
//       req.user.id,
//       {
//         pin: newPin,
//       },
//       {
//         new: true,
//       }
//     );

//     return res.send(successResponse("PIN updated successfully", null));

//     // const otpSent = await sendOtp(
//     //   user?.phoneNumber.number,
//     //   otp,
//     //   userId as string,
//     //   res
//     // );
//     // if (otpSent) {
//     //   return res.send(successResponse("Otp sent successfully", null));
//     // } else {
//     //   throw new ServiceError("Error sending OTP");
//     // }
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// };

// export const verifyBVN = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;

//     const { bvn } = req.body;
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     if (user.bvnVerified) {
//       throw new ServiceError("BVN already verified");
//     }

//     let response;

//     try {
//       response = await okraService.verifyBvn(bvn);
//     } catch (error) {
//       console.error(error);
//       throw new ServiceError("Unable to validate bvn");
//     }

//     const userPlatformName = {
//       firstName: user.firstName,
//       lastName: user.lastName,
//     };
//     const bvnName = {
//       firstName: response.firstname,
//       lastName: response.lastname,
//     };

//     if (!config.env.isDevelopment) {
//       if (!bvnMatch(userPlatformName, bvnName)) {
//         throw new AuthenticationError("BVN details do not match");
//       }
//     }

//     await User.findByIdAndUpdate(userId, {
//       bvnVerified: true,
//     });
//     return res.send(successResponse("BVN successfully verified", null));
//   } catch (error) {
//     next(error);
//   }
// };

// interface UserName {
//   firstName: string;
//   lastName: string;
// }

// const bvnMatch = (userPlatformName: UserName, bvnName: UserName) => {
//   let verified = false;
//   console.log(
//     userPlatformName.firstName.toLowerCase() === bvnName.firstName.toLowerCase()
//   );
//   console.log(
//     userPlatformName.lastName.toLowerCase() === bvnName.lastName.toLowerCase()
//   );

//   if (
//     userPlatformName.firstName.toLowerCase() ===
//       bvnName.firstName.toLowerCase() ||
//     userPlatformName.lastName.toLowerCase() === bvnName.lastName.toLowerCase()
//   ) {
//     verified = true;
//   }
//   return verified;
// };

// export const checkAndUpdateProfileComletion = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;
//     // check if user exist
//     const user = await checkUserById(userId as string);

//     const newProfileCompletion = await calculateProfileCompletion(
//       user.phoneVerified,
//       user.kycComplete,
//       user.emailverified,
//       user.bvnVerified
//     );
//     // update user profile completion
//     await User.updateOne(
//       { _id: userId },
//       { profileCompletion: newProfileCompletion }
//     );
//     // return res.status(200).json({
//     //   success: true,
//     //   msg: "Profile completion updated successfully",
//     //   newProfileCompletion,
//     // });
//     return res.send(
//       successResponse("Profile completion updated successfully", null)
//     );
//   } catch (error) {
//     next(error);
//   }
// };

// // Referral code generator
// export const generateReferralCode = async (next: NextFunction) => {
//   try {
//     let referralCode = generateRefCode();

//     // check to make sure referralcodes are unique
//     let existingReferralCode = await User.findOne({
//       referralCode: referralCode,
//     });

//     while (existingReferralCode) {
//       referralCode = generateRefCode();
//       existingReferralCode = await User.findOne({
//         referralCode: referralCode,
//       });
//     }
//     return referralCode;
//   } catch (err) {
//     next(err);
//   }
// };

// // check if user is referred by another user
// const isValidReferral = async (referredById: string) => {
//   let referredBy = await User.findOne({
//     referralCode: referredById,
//   });

//   if (!referredBy) {
//     return false;
//   }
//   return true;
// };

// // save referredBy id to user
// const addReferralCodeToUser = async (referredUserId, referredById) => {
//   await User.findByIdAndUpdate(referredUserId, {
//     referredBy: referredById,
//   });
// };

// // saving/updating user's interest
// export const updateUserInterest = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;
//     const { interest } = req.body;

//     // converting it to lowercase
//     const lowerCaseInterest = interest.toLowerCase();

//     const user = await checkUserById(userId as string);

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     // Checking if interest already exists in the interest array
//     if (user.interests.includes(lowerCaseInterest)) {
//       return res.send(
//         successResponse("Interest already exists", lowerCaseInterest)
//       );
//     } else {
//       user.interests.push(lowerCaseInterest);
//       await user.save();
//       return res.send(
//         successResponse("Interest updated successfully", lowerCaseInterest)
//       );
//     }
//   } catch (error) {
//     next(error);
//   }
// };

// export const getBeneficiaries = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;

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

// export const suspendUserAccountAdmin = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { userId, reason } = req.body; // user to deactivte

//     // Admin performing action will be authenticated via middleware checks

//     // check if reason is provided
//     if (!reason) {
//       throw new NotFoundError("Reason for deactivation is required");
//     }

//     // check if user exists
//     let user = await User.findById(userId);

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     // Deactivate the user by updating the status to "suspended"
//     user.status = "suspended";
//     await user.save();

//     // Create a DeactivatedUser document to store the deactivation information
//     const deactivatedUserData = {
//       userId: userId,
//       reason: reason,
//       // deactivatedBy: deactivatedBy, // You can pass the admin user's ID here
//     };

//     const deactivatedUser = new DeactivatedUser(deactivatedUserData);
//     await deactivatedUser.save();

//     return res.send(successResponse(`User with ID: ${userId} deactivated successfully`, {}));
//   } catch (err) {
//     next(err);
//   }
// };

// export const updateProfile = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   // const { bio, profilePictureUrl } = req.body;
//   const userId = req.user && req.user.id;

//   try {
//     // TODO: Move this check to the schema
//     // if (!bio) {
//     //   throw new NotFoundError('Bio is required');
//     // }
//     // const user = await User.findById(userId);

//     // const user = await axios.get('get-user-id');

//     // if (!user) {
//     //   throw new NotFoundError("User not found");
//     // }

//     const updatedUser = await User.findByIdAndUpdate(userId, req.body, {
//       new: true,
//     });

//     return res.send(
//       successResponse("Profile updated successfully", updatedUser)
//     );
//   } catch (err) {
//     next(err);
//   }
// };

// export const addBeneficiary = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { beneficiaryId } = req.body;
//     const userId = req.user && req.user.id;

//     const user = await User.findById(userId);
//     const beneficiary = await User.findById(beneficiaryId);

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     if (!beneficiary) {
//       throw new NotFoundError("Beneficiary not found");
//     }

//     // check if beneficiary exists
//     if (user.beneficiaries.includes(beneficiary._id)) {
//       throw new ConflictError("Beneficiary already exists");
//     }

//     user.beneficiaries.push(beneficiary._id);

//     await user.save();

//     const { firstName, lastName, _id, mototag } = beneficiary;

//     return res.send(
//       successResponse("Beneficiary saved", {
//         _id,
//         firstName,
//         lastName,
//         mototag,
//       })
//     );
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// };

// export const filterByTagOrName = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { query } = req.query as {
//       [key: string]: string;
//     };

//     if (!query) {
//       throw new ValidationError("Query cannot be empty");
//     }

//     let searchQuery = query.toString();

//     if (searchQuery.startsWith("0")) {
//       // Strip the leading zero and prepend +234
//       searchQuery = "234" + searchQuery.substring(1);
//     }

//     const phoneRegex = new RegExp(searchQuery.replace(/\+/g, "\\+"), "i"); // Escape the + character

//     const filteredResult = await User.find({
//       $and: [
//         {
//           $or: [
//             { firstName: new RegExp(searchQuery, "i") },
//             { lastName: new RegExp(searchQuery, "i") },
//             { mototag: new RegExp(searchQuery, "i") },
//             { "phoneNumber.number": phoneRegex },
//           ],
//         },
//         {
//           mototag: { $exists: true, $ne: "" },
//         },
//         {
//           _id: { $ne: req.user?.id },
//         },
//       ],
//     }).select("firstName lastName phoneNumber.number mototag _id");

//     return res.send(successResponse("Filtered successfully!", filteredResult));
//   } catch (err) {
//     console.error(err.message);
//     next(err);
//   }
// };

// //@desc     Follow a user
// //@route    PUT /api/users/:userId/follow
// //@access   Private

// export const followUser = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   // Check if the user is trying to follow themselves
//   try {
//     // Find the user to be followed
//     const userToFollow: any = await User.findById(req.params.id);

//     // Check if the user being followed exists
//     const currentUser: any = await User.findById(req.user.id);

//     // Ensure that user cannot follow themselves
//     if (currentUser === userToFollow) {
//       return next(new ServiceError("You cannot follow yourself"));
//     }

//     // Check if the user is not already being followed
//     if (userToFollow?.followers.includes(req.user.id)) {
//       // Return an error response if the user is already being followed
//       return next(new ServiceError("You already followed this user"));
//     } else {
//       // Update the user to be followed to add the follower
//       await userToFollow.followers.push(req.user.id);

//       // Update the current user's followings list
//       await currentUser.followings.push(req.params.id);

//       currentUser.followingCount++;
//       userToFollow.followerCount++;

//       await currentUser.save();
//       await userToFollow.save();

//       // Return a success response
//       res.status(200).json({
//         success: true,
//         data: currentUser,
//         message: "Followed!",
//       });
//     }
//   } catch (error) {
//     // Handle any errors that occur during the process
//     next(error);
//   }
// };

// //@desc     Unfollow a user
// //@route    DELETE api/users/:userId/unfollow
// //@access   Private

// export const unfollowUser = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   // Check if the user is trying to unfollow themselves
//   try {
//     // Find the user to be unfollowed
//     const userToUnfollow: any = await User.findById(req.params.id);

//     // Find the current user
//     const currentUser: any = await User.findById(req.user.id);

//     // Ensure that user cannot unfollow themselves
//     if (currentUser === userToUnfollow) {
//       return next(new ServiceError("You cannot unfollow yourself"));
//     }

//     // Check if the current user is following the other user
//     if (currentUser && userToUnfollow?.followers.includes(req.user.id)) {
//       // Update the user to be unfollowed to remove the follower
//       await userToUnfollow.followers.pull(req.user.id);

//       // Update the current user's followings list to remove the unfollowed user
//       await currentUser.followings.pull(req.params.id);

//       currentUser.followingCount--;
//       userToUnfollow.followerCount--;

//       await currentUser.save();
//       await userToUnfollow.save();

//       // Return a success response
//       res.status(200).json({
//         success: true,
//         data: currentUser,
//         message: "Unfollowed!",
//       });
//     } else {
//       // Return a response indicating that the user is not following the other user
//       res.status(200).json({
//         success: false,
//         message: "You do not follow this user",
//       });
//     }
//   } catch (error) {
//     // Handle any errors that occur during the process
//     next(error);
//   }
// };

// //@desc      Get a user's followers
// //@route    /api/users/:id/followers
// //@access   Private

// export const getFollowers = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     // Find the user in the db
//     const user = await User.findById(id);

//     // Check if user exists
//     if (!user) {
//       return next(new NotFoundError("User not found"));
//     }

//     // Get followers
//     const followers = await User.find({
//       _id: { $in: user.followers },
//     });

//     res.status(200).json({
//       success: true,
//       data: followers,
//       count: followers.length,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// //@desc    Get followings
// //@route   /api/users/:id/following
// //@access  Private

// export const getFollowings = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { id } = req.params;
//   try {
//     // Check if user is in db
//     const user = await User.findById(id);

//     // Check if the user exists
//     if (!user) {
//       return next(new NotFoundError("User does not exist"));
//     }

//     // Get followings
//     const followings = await User.find({
//       _id: { $in: user.followings },
//     });

//     res.status(200).json({
//       success: true,
//       data: followings,
//       count: followings.length,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc      Generate a follow user QR code
// // @route     GET /api/users/:userId/follow
// // @access    Private

// export const generateFollowQR = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const qrContent = `http://localhost:8000/users/${id}/follow/scan`;

//     const qr = await qrCode.toDataURL(qrContent);

//     res.status(200).json({
//       data: qr,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const uploadProfilePicture = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const userId = req.user?.id;

//   try {
//     let user = await User.findById(userId);

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     // This will store the file in memory and attach it to req.file
//     singleImageUpload(req, res, async (multerError) => {
//       if (multerError) {
//         return res.status(422).json({
//           status: "error",
//           errors: [
//             {
//               title: "Image upload error",
//               detail: multerError.message,
//             },
//           ],
//         });
//       }

//       // Proceed to upload (or fetch existing) from S3
//       // const url = await uploadToS3(req, res, next);
//       const profilePictureName = await uploadToS3(req, res, next);

//       if (!profilePictureName) {
//         throw new NotFoundError("Image name does not exist");
//       }

//       // update user profile picture with url
//       user = await User.findByIdAndUpdate(
//         user._id,
//         {
//           profilePictureName,
//         },
//         {
//           new: true,
//         }
//       );

//       const url = await getImageUrl(user.profilePictureName, next);

//       user = await User.findByIdAndUpdate(
//         user._id,
//         {
//           profilePictureUrl: url,
//         },
//         {
//           new: true,
//         }
//       );

//       return res.send(successResponse("Image upload successful!", { url }));
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getUserConnections = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.param.id;
//     const { id } = req.params;
//     const user = await User.findById(id);
//     if (!user) {
//       return next(new NotFoundError("User not found"));
//     }

//     const followers = user.followers.map((follower) => follower.toString());
//     const following = user.followings.map((follow) => follow.toString());

//     // Merge followers and following arrays
//     const connectionsIds = [...followers, ...following];

//     // Fetch detailed information for each user in connections
//     const connectionsDetails = await Promise.all(
//       connectionsIds.map(async (connectionId) => {
//         return User.findById(connectionId)
//           .select("-createdAt -updatedAt -__v -password -otp")
//           .populate("mainWallet")
//           .populate("lockedFunds")
//           .populate("savingTargets")
//           .populate({
//             path: "shop",
//             populate: {
//               path: "category",
//               model: Category,
//             },
//           })
//           .exec();
//       })
//     );

//     res.status(200).json({
//       success: true,
//       connections: connectionsDetails,
//       totalCount: connectionsDetails.length,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
