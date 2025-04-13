// import express from "express";
// import { checkPermission } from "../../middlewares/checkPermission";
// import {
// 	createAdminUser,
// 	suspendMotopayUser,
// 	reActivateMotopayUser,
// 	suspendShop,
// 	reActivateShop,
// 	processLoanRequest,
// 	getAllAdminUsers,
// 	getSingleAdminUsers,
// 	changeAdminStatus,
// 	changePassword,
// 	updateProfile,
// 	verifyAdminUser,
// 	resendOtp,
// 	forgetPassword,
// 	getSingleUser,
// 	getBeneficiaries,
// } from "../../controllers/adminControllers/adminUserController";
// import { authenticateAdmin } from "../../middlewares/adminAuth";
// import validateResource from "../../middlewares/validateResource";
// import { ProcessLoanSchema } from "../../validation/loan.schema";
// import { get } from "lodash";
// import { getUsers } from "../../controllers/adminController";

// const router = express.Router();

// // Get All Users - Admin
// router.get('/get-all', authenticateAdmin, checkPermission('get-all-users'), getUsers);

// router.post(
// 	"/",
// 	// authenticateAdmin,
// 	// checkPermission("register-admin"),
// 	createAdminUser
// );

// router.patch(
// 	"/suspend",
// 	authenticateAdmin,
// 	checkPermission("suspend-user"),
// 	suspendMotopayUser
// );

// router.patch(
// 	"/reactivate",
// 	authenticateAdmin,
// 	checkPermission("reactivate-user"),
// 	reActivateMotopayUser
// );

// router.patch(
// 	"/suspend-shop",
// 	authenticateAdmin,
// 	checkPermission("suspend-shop"),
// 	suspendShop
// );

// router.patch(
// 	"/reactivate-shop",
// 	authenticateAdmin,
// 	checkPermission("reactivate-shop"),
// 	reActivateShop
// );

// router.post(
// 	"/process-loan",
// 	authenticateAdmin,
// 	checkPermission("process-loan-request"),
// 	validateResource(ProcessLoanSchema),
// 	processLoanRequest
// );

// router.get(
// 	"/get-all-admin-users",
// 	authenticateAdmin,
// 	getAllAdminUsers
// );

// router.get(
// 	"/get-single-admin-user/:id",
// 	authenticateAdmin,
// 	getSingleAdminUsers
// );

// router.patch(
// 	"/change-status/:id",
// 	authenticateAdmin,
// 	checkPermission("change-admin-status"),
// 	changeAdminStatus
// );

// router.patch(
// 	"/change-password",
// 	authenticateAdmin,
// 	changePassword
// );

// router.patch(
// 	"/update-profile/:id",
// 	authenticateAdmin,
// 	checkPermission("update-admin-profile"),
// 	updateProfile
// );

// router.patch("/verify", verifyAdminUser);

// router.patch("/resend-otp", resendOtp);

// router.patch("/forget-password", forgetPassword);

// router.get('/get-beneficiaries/:id', getBeneficiaries);

// // Get single user admin
// router.get("/:id", getSingleUser);


// export default router;
