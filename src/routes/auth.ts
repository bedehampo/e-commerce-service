// import express from "express";
// import {
//   getAllUsers,
//   getLoggedInUser,
//   getSingleUser,
//   login,
//   phoneVerified,
//   resendOtpWithToken,
//   resendOtpWithPhone,
//   validateOtpAndUpdatePassword,
//   verifyDevice,
//   verifyOtp,
//   verifyOtpAndUpdatePin,
//   forgotPassword,
//   verifyOtpForUpdatePassword,
// } from "../controllers/authController";
// import auth from "../middlewares/auth";
// import validateResource from "../middlewares/validateResource";
// import { LoginSchema } from "../validation/login.schema";

// const router = express.Router();

// // Log in user
// router.post("/", validateResource(LoginSchema), login);

// // Get logged in user
// router.get("/me", auth, getLoggedInUser);

// // router.post("/verify-pin", getIpAndUserAgent, verifyDevice);

// //router.post("/verify-device", getIpAndUserAgent, verifyDevice);
// // verify user
// router.patch("/verify-phone/:id", phoneVerified);

// // Resend OTP Before Registration
// router.patch("/resend-otp-with-phone", resendOtpWithPhone);

// // Resend OTP after authentication
// router.patch("/resend-otp-auth", auth, resendOtpWithToken);

// // verify OTP
// router.post("/verify-otp", auth, verifyOtp);

// // Forget password
// router.post("/forgot-password", forgotPassword);

// // Verify OTP for Update Password
// router.post("/verify-otp-for-password-update", verifyOtpForUpdatePassword);

// // Verify OTP and Update Password
// router.patch("/validate-otp-and-update-password", validateOtpAndUpdatePassword);

// // Verify OTP and Pin
// router.patch("/verify-otp-and-update-pin", auth, verifyOtpAndUpdatePin);

// // Verify OTP and Pin
// router.patch(
//   "/verify-otp-and-update-password",
//   auth,
//   validateOtpAndUpdatePassword
// );

// export default router;
