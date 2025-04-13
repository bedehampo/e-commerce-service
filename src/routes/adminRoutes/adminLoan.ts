// import express from "express";
// import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
// import { checkPermission } from "../../middlewares/checkPermission";
// import validateResource from "../../middlewares/validateResource";
// import {
// 	AddLoanEligibilitySettingsSchema,
// 	CreateLoanBioFieldSchema,
// 	CreateLoanTypeSchema,
// 	ProcessLoanSchema,
// 	UpdateLoanEligibilitySettingsSchema,
// 	UpdateLoanTypeSchema,
// } from "../../validation/loan.schema";
// import {
// 	addLoanEligibilitySettings,
// 	createLoanBioField,
// 	createLoanType,
// 	getBucketLoanRecords,
// 	getLoanApprovalsForALoan,
// 	getLoanBioFields,
// 	getLoanEligibilitySettings,
// 	getLoanOverviewStats,
// 	getLoanRequests,
// 	getLoanTypes,
// 	getNanoLoanRecords,
// 	getPersonalLoanRecords,
// 	getSingleLoanRequest,
// 	processLoanRequest,
// 	updateLoanEligibilitySettings,
// 	updateLoanType,
// } from "../../controllers/adminControllers/adminLoanController";
// import auth from "../../middlewares/auth";

// const router = express.Router();

// router.post(
// 	"/process-loan",
// 	authenticateAdmin,
// 	// checkPermission("assign-role"),
// 	validateResource(ProcessLoanSchema),
// 	processLoanRequest
// );

// router.get("/", authenticateAdmin, getLoanRequests);

// router.get(
// 	"/get-personal-loan-records",
// 	authenticateAdmin,
// 	// checkPermission("get-loan-requests"),
// 	getPersonalLoanRecords
// );

// router.get(
// 	"/get-nano-loan-records",
// 	authenticateAdmin,
// 	// checkPermission("get-loan-requests"),
// 	getNanoLoanRecords
// );

// router.get(
// 	"/get-bucket-loan-records/:year",
// 	authenticateAdmin,
// 	// checkPermission("get-loan-requests"),
// 	getBucketLoanRecords
// );

// //loan overview stats
// router.get(
// 	"/loan-overview",
// 	authenticateAdmin,
// 	// checkPermission("get-loan-requests"),
// 	getLoanOverviewStats
// );

// router.get(
// 	"/single/:loadId",
// 	authenticateAdmin,
// 	getSingleLoanRequest
// );

// //get loan eligibility settings
// router.get(
// 	"/get-eligibility-settings",
// 	authenticateAdmin,
// 	getLoanEligibilitySettings
// );

// // add loan eligibility setting
// router.post(
// 	"/add-eligibility-setting",
// 	authenticateAdmin,
// 	validateResource(AddLoanEligibilitySettingsSchema),
// 	addLoanEligibilitySettings
// );

// //update loan eligibility setting
// router.put(
// 	"/edit-eligibility-setting/:id",
// 	authenticateAdmin,
// 	validateResource(UpdateLoanEligibilitySettingsSchema),
// 	// checkPermission("update-eligibility-setting"),
// 	updateLoanEligibilitySettings
// );
// export default router;

// //get loan types

// router.get("/loan-types", authenticateAdmin, getLoanTypes);
// router.post(
// 	"/loan-types",
// 	authenticateAdmin,
// 	validateResource(CreateLoanTypeSchema),
// 	createLoanType
// );
// router.post(
// 	"/loan-bio-fields",
// 	authenticateAdmin,
// 	validateResource(CreateLoanBioFieldSchema),
// 	createLoanBioField
// );
// router.get(
// 	"/loan-bio-fields",
// 	authenticateAdmin,
// 	getLoanBioFields
// );
// router.get("/", authenticateAdmin, getLoanRequests);

// // loan type update
// router.patch(
// 	"/update-loan-type/:id",
// 	authenticateAdmin,
// 	validateResource(UpdateLoanTypeSchema),
// 	updateLoanType
// );

// router.get(
// 	"/loan-approvals/:loanId",
// 	authenticateAdmin,
// 	getLoanApprovalsForALoan
// );

// //add loan bio fields
// // router.patch("/single/:loadId", authenticateAdmin, getSingleLoanRequest);

// //add loan platform configuration
// // router.post(
// //   "/add-platform-configuration",
// //   authenticateAdmin,
// //   addPlatformConfiguration
// // );

// // //update loan platform configuration
// // router.put(
// //   "/update-platform-configuration/:id",
// //   authenticateAdmin,
// //   updatePlatformConfiguration
// // );
