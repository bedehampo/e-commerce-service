// import express from "express";
// import {
// 	getAllLockedFunds,
// 	getMyLockedFundAccounts,
// 	getMySingleLockedFund,
// 	topUpLockedFundAccount,
// 	withdrawAndCreateLockedFundAccount,
// 	withdrawLockedFund,
// } from "../controllers/lockFundController";

// import auth from "../middlewares/auth";
// import { validatePin } from "../middlewares/checkPinMiddleware";

// const router = express.Router();

// // Get Budget Wallets - Admin
// router.post(
// 	"/",
// 	auth,
// 	validatePin,
// 	withdrawAndCreateLockedFundAccount
// );

// router.get("/", auth, getMyLockedFundAccounts);

// router.get(
// 	"/single-lockedfund/:lockedfundId",
// 	auth,
// 	getMySingleLockedFund
// );

// router.get("/admin", auth, getAllLockedFunds);

// router.patch(
// 	"/:lockedFundId",
// 	auth,
// 	validatePin,
// 	topUpLockedFundAccount
// );

// router.patch(
// 	"/withdraw/:lockedFundId",
// 	auth,
// 	validatePin,
// 	withdrawLockedFund
// );

// export default router;
