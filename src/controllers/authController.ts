// import bcrypt from "bcrypt";
// import { NextFunction, Request, Response } from "express";
// import jwt from "jsonwebtoken";
// import { parsePhoneNumber } from "libphonenumber-js";
// import config from "../config";
// import {
//   AuthenticationError,
//   AuthorizationError,
//   NotFoundError,
//   ServiceError,
//   ValidationError,
// } from "../errors";
// import { successResponse } from "../helpers/index";
// import { checkUserByPhoneNumber } from "../middlewares/validators";
// import { User } from "../model/User";
// import { createAccountSession, verifyDeviceService } from "../services";
// import {
//   generateOtp,
//   sendOtp,
//   validateOtp,
//   decodeToken,
// } from "../utils/global";
// import { CustomRequest, RequestWithUserAgent } from "../utils/interfaces";
// import Numbers from "twilio/lib/rest/Numbers";

// export const getLoggedInUser = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user && req.user.id;

// // // //     const user = await User.findById(userId as string)
// // // //       .select("-password -createdAt -updatedAt")
// // // //       .populate("mainWallet", "-userId -createdAt -updatedAt -__v")
// // // //       .populate("referredBy", "")
// // // //       .populate({
// // // //         path: "beneficiaries",
// // // //         select: "firstName lastName mototag _id",
// // // //       });

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     return res.send(
//       successResponse("Logged in user retrieved", {
//         user,
//       })
//     );
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// };

// // User Login
// export const login = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // const userAgent = req.headers['user-agent'];
//     const userAgent = req.userAgent && req.userAgent;

//     // throw new AuthenticationError("Invalid credentials");
//     // Required fields and authentication
//     let { phoneNumber, password, device_Id } = req.body;
//     if (!phoneNumber || !password) {
//       throw new ServiceError("all field are mandatory");
//     }
//     // verify phoneNumber
//     const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
//     const isValidPhoneNumber = parsedPhoneNumber && parsedPhoneNumber.isValid();
//     if (isValidPhoneNumber) {
//       let { country, countryCallingCode, nationalNumber, number } =
//         parsedPhoneNumber;
//       phoneNumber = {
//         country,
//         countryCallingCode,
//         nationalNumber,
//         number,
//       };
//     }

//     // check existing user
//     const user = await checkUserByPhoneNumber(phoneNumber.number);

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     const otp = config.env.isProduction ? generateOtp() : "1234";

//     if (user.phoneVerified === false) {
//       // send otp message
//       await sendOtp(user?.phoneNumber.number, otp, user._id.toString(), res);
//     }
//     // verify the password
//     const matchPassword = await bcrypt.compare(password, user.password);
//     if (!matchPassword) {
//       throw new AuthenticationError("Invalid credentials");
//     }

//     // updating user status to active on first login
//     if (user.status === "pending") {
//       await User.updateOne({ status: "active" });
//     }

//     // updating user profile completion
//     // let profileProgress = await calculateProfileCompletion(
//     //   user.phoneVerified,
//     //   user.kycComplete,
//     //   user.emailverified,
//     //   user.bvnVerified
//     // );

//     // await User.updateOne({ profileCompletion: profileProgress });

//     const { unknownDevice, token } = await createAccountSession(
//       config.env.isProduction ? device_Id : userAgent,
//       user,
//       userAgent as string
//     );

//     return res.send(
//       successResponse("Login successful", {
//         token,
//         user: {
//           // id: user._id,
//           kycComplete: user.kycComplete,
//           phoneVerified: user.phoneVerified,
//         },
//       })
//     );
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// };

// // // Get a single user
// export const getSingleUser = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const user = await User.findById(req.params.id).select(
//       "-createdAt -updatedAt -__v -password -otp"
//     );

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     res.status(200).send(successResponse("User retrieved successfully", user));
//   } catch (err: any) {
//     console.log(err);
//     next(err);
//   }
// };

// // Get all users
// export const getAllUsers = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const users = await User.find().select(
//       "-createdAt -updatedAt -__v -password -otp"
//     );
//     res.send(successResponse("Users retrieved successfully", users));
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// };

// //     if (!user) {
// //       throw new NotFoundError("User not found");
// //     }

// //     const isValidOtp = await validateOtp(otp, userId as string);

// //     if (isValidOtp === false) {
// //       throw new AuthorizationError("Expired or Invalid OTP");
// //     } else {
// //       await User.findByIdAndUpdate(
// //         userId,
// //         {
// //           phoneVerified: true,
// //         },
// //         { new: true }
// //       ).select("-password -createdAt -updatedAt -__v");
// //       return res.send(successResponse("OTP verification successful", null));
// //     }
// //   } catch (err) {
// //     console.error(err);
// //     next(err);
// //   }
// // };

// // // Forgot Password
// // export const forgotPassword = async (
// //   req: Request,
// //   res: Response,
// //   next: NextFunction
// // ) => {
// //   try {
// //     // ask a user for their phone number
// //     const { phoneNumber } = req.body;

// //     // validate properties
// //     if (!phoneNumber) {
// //       throw new NotFoundError("empty field not allow");
// //     }

//     const isValidOtp = await validateOtp(otp, userId as string);

// //     if (!user) {
// //       throw new NotFoundError("user not found");
// //     }
// //     // generate otp
// //     const otp = config.env.isProduction ? generateOtp() : "1234";

// //     // update otp in db
// //     await User.findByIdAndUpdate(user._id, {
// //       "otp.otp": otp,
// //     });

// //     // send otp to user
// //     await sendOtp(user?.phoneNumber.number, otp, user._id.toString(), res);

// //     return res.send(successResponse("OTP sent successfully", null));
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // // Verify OTP and update password
// // // export const verifyOtpForUpdatePassword = async (
// // //   req: CustomRequest,
// // //   res: Response,
// // //   next: NextFunction
// // // ) => {
// // //   try {
// // //     const { otp, phoneNumber, device_Id } = req.body;

//     // update otp in db
//     await User.findByIdAndUpdate(user._id, {
//       "otp.otp": otp,
//     });

//     // send otp to user
//     await sendOtp(user?.phoneNumber.number, otp, user._id.toString(), res);

//     return res.send(successResponse("OTP sent successfully", null));
//   } catch (error) {
//     next(error);
//   }
// };

// // Verify OTP and update password
// export const verifyOtpForUpdatePassword = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { otp, phoneNumber, device_Id } = req.body;

//     const userAgent = req.userAgent && req.userAgent;

//     let user = await User.findOne({
//       "phoneNumber.number": phoneNumber,
//     });

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     const isValidOtp = await validateOtp(otp, user._id.toString());

//     if (isValidOtp === false) {
//       throw new AuthorizationError("Expired or Invalid OTP");
//     } else {
//       const { unknownDevice, token } = await createAccountSession(
//         config.env.isProduction ? device_Id : userAgent,
//         user,
//         userAgent as string
//       );
//       return res.send(
//         successResponse("OTP verified", {
//           token,
//         })
//       );
//     }
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// };

// // export const validateOtpAndUpdatePassword = async (
// //   req: CustomRequest,
// //   res: Response,
// //   next: NextFunction
// // ) => {
// //   try {
// //     const { token, newPassword } = req.body;

// //     if (!token) {
// //       throw new NotFoundError("Token not found");
// //     }

// //     const tokenUser = (await decodeToken(token)) as {
// //       id: string;
// //       phoneNumber: string;
// //     };

// //     const userAgent = req.userAgent && req.userAgent;
// //     const userId = req.user && req.user.id;

// //     let user = await User.findById(tokenUser.id);

// //     if (!user) {
// //       throw new NotFoundError("User not found");
// //     }

// //     // encrypt password
// //     const salt = await bcrypt.genSalt(10);
// //     let password = await bcrypt.hash(newPassword, salt);

// //     // update user password
// //     await User.findByIdAndUpdate(
// //       user._id.toString(),
// //       {
// //         password,
// //       },
// //       { new: true }
// //     ).select("-password -createdAt -updatedAt -__v");

// //     return res.send(successResponse("Password changed successfully", null));
// //   } catch (err) {
// //     next(err);
// //   }
// // };

// // Verify OTP and update pin
// // // export const verifyOtpAndUpdatePin = async (
// // //   req: CustomRequest,
// // //   res: Response,
// // //   next: NextFunction
// // // ) => {
// // //   try {
// // //     const userId = req.user && req.user.id;

//     const { otp } = req.body;

//     let user = await User.findById(userId);

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     const isValidOtp = await validateOtp(otp, userId as string);

//     if (isValidOtp === false) {
//       throw new AuthorizationError("Expired or Invalid OTP");
//     } else {
//       await User.findByIdAndUpdate(
//         userId,
//         {
//           pin: user.tempPin,
//         },
//         { new: true }
//       ).select("-password -createdAt -updatedAt -__v");
//       return res.send(successResponse("Pin updated successfully", null));
//     }
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// };

// // // Resend OTP Before Registration
// // // export const resendOtpWithPhone = async (
// // //   req: Request,
// // //   res: Response,
// // //   next: NextFunction
// // // ) => {
// // //   try {
// // //     // validate request body
// // //     const { phoneNumber } = req.body;

// //     // if (!phoneNumber) {
// //     //   throw new ValidationError("Empty field not allowed");
// //     // }
// //     // // checking if phone number is existing
// //     // const user = await User.findOne({
// //     //   "phoneNumber.number": phoneNumber,
// //     // });

// // // //     if (!user) {
// // // //       throw new NotFoundError("User not found");
// // // //     }
// // // //     const otp = config.env.isProduction ? generateOtp() : "1234";

// //     // update otp in db
// // //     await User.findByIdAndUpdate(user._id, {
// // //       "otp.otp": otp,
// // //     });

//     await sendOtp(user.phoneNumber.number, otp, user._id.toString(), res);

//     return res.send(successResponse("OTP sent successfully", null));
//   } catch (error) {
//     next(error);
//   }
// };

// // Resend OTP
// // // export const resendOtpWithToken = async (
// // //   req: CustomRequest,
// // //   res: Response,
// // //   next: NextFunction
// // // ) => {
// // //   try {
// // //     const userId = req.user && req.user.id;
// // //     // checking user is existing
// // //     const user = await User.findById(userId);

//     if (!user) {
//       // return res.status(404).json({
//       //   success: false,
//       //   msg: "User not found",
//       // });
//       throw new NotFoundError("User not found");
//     }

// // //     const otp = config.env.isProduction ? generateOtp() : "1234";
// // //     await User.findByIdAndUpdate(user._id, {
// // //       "oto.otp": otp,
// // //     });

// // //     await sendOtp(user.phoneNumber.number, otp, userId as string, res);
// // //     return res.send(successResponse("OTP sent successfully", null));
// // //   } catch (error) {
// // //     next(error);
// // //   }
// // // };

// // // Verify phone Number using otp
// // // export const phoneVerified = async (
// // //   req: Request,
// // //   res: Response,
// // //   next: NextFunction
// // // ) => {
// // //   try {
// // //     const { otp } = req.body;
// // //     const user = await User.findById(req.params.id);

// //     // if (!user) {
// //     //   throw new NotFoundError("User not found");
// //     // }

// //     // const isValidOtp = await validateOtp(otp, req.params.id);

// //     // if (isValidOtp === false) {
// //     //   throw new AuthorizationError("Expired or Invalid OTP");
// //     // } else {
// //     //   await User.findByIdAndUpdate(user._id, {
// //     //     phoneVerified: true,
// //     //   });

// // //       return res.send(successResponse("OTP verified successfully", null));
// // //     }
// // //   } catch (err) {
// // //     console.error(err);
// // //     next(err);
// // //   }
// // // };
