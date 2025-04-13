// import express, { Response } from "express";
// import {
//   completeMotoTransfer,
//   generateReceipt,
//   getAllTransactions,
//   getSavingTargetsandLockedFunds,
//   getTransactionById,
//   initiateTransaction,
// } from "../controllers/transactionsController";
// import auth from "../middlewares/auth";

// import { validatePin } from "../middlewares/checkPinMiddleware";
// import { CustomRequest } from "../utils/interfaces";

// const router = express.Router();

// router.get(
//   "/budgets",
//   auth,
//   getSavingTargetsandLockedFunds
// );

// // Initiate a transaction
// router.post("/initiate-moto-txf", auth, initiateTransaction);

// router.post("/complete-moto-txf", auth, validatePin, completeMotoTransfer);

// router.get("/", auth, getAllTransactions);

// router.get("/", auth, getAllTransactions);

// // Generate receipt
// router.post('/generate-receipt', auth, generateReceipt);

// // Get Transaction by id
// router.get("/:id", auth, getTransactionById);

// // hello world


// export default router;
