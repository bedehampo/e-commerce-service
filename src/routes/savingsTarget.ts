// import express from "express";
// import auth from "../middlewares/auth";
// import {
// 	createSavingTarget,
// 	// manualTopUpSavingTarget,
// 	// automaticTopUpSavingTarget,
// 	// withdrawFromSavingTarget,
// 	// getMySavingTargetAccounts,
// 	// getMySingleSavingTargetAccount,
// 	// getAllSavingTarget,
// 	// getSingleSavingTarget,
// 	// updateSavingTargetMethod,
// 	// cancelSavingTarget,
// } from "../controllers/savingTargetController";
// // import { validatePin } from "../middlewares/checkPinMiddleware";

// const router = express.Router();

// router.post("/", auth, createSavingTarget);

// router.patch(
// 	"/:savingTargetId",
// 	auth,

// 	manualTopUpSavingTarget
// );
// router.patch(
// 	"/auto/:savingTargetId",
// 	auth,
// 	automaticTopUpSavingTarget
// );
// router.get("/all-my-savingtargets", auth, getMySavingTargetAccounts);

// router.get(
// 	"/my-single/:savingTargetId",
// 	auth,
// 	getMySingleSavingTargetAccount
// );

// router.patch(
// 	"/withdraw/:savingTargetId",
// 	auth,
// 	validatePin,
// 	withdrawFromSavingTarget
// );
// router.patch(
// 	"/method/:savingTargetId",
// 	auth,
// 	updateSavingTargetMethod
// );
// router.patch(
// 	"/cancel/:savingTargetId",
// 	auth,
// 	validatePin,
// 	cancelSavingTarget
// );

// // admin routes - to be validate later
// router.get("/admin", getAllSavingTarget);
// router.get("/admin", getSingleSavingTarget);

// export default router;
