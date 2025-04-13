import {
  AppealLoanSchema,
  CalculateLoanPaymentScheduleSchema,
  ComputeLoanEligibilitySchema,
  CreateLoanExistingSchema,
  CreateLoanSchema,
  LiquidateLoanSchema,
  LoanBalanceUpdateSchema,
  LoanDuePaymentSchema,
  MandateCreatedSchema,
  RecovaSmsAlertSchema,
} from "../validation/loan.schema";
import {
  appealLoan,
  calculateLoanRepaymentSchedule,
  checkIfUserHasLoan,
  // checkIfUserHasLoanBio,
  completeLoan,
  computeLoanEligibility,
  createLoan,
  getLoanCategories,
  getLoanDetails,
  getLoanDurations,
  getLoanRepaymentSchedule,
  getLoanTypes,
  getLoans,
  liquidateLoan,
  loanDuePayment,
  // saveOkraCustomer,
} from "../controllers/loanController";
import express from "express";
import validateResource from "../middlewares/validateResource";
import auth from "../middlewares/auth";
import {
  recovaLoanBalanceUpdate,
  recovaMandateCreated,
  recovaSMSAlert,
} from "../controllers/webhook/recova";

const router = express.Router();

router.get("/", auth, getLoans);
router.get("/details/:loanId", auth, getLoanDetails);

router.post("/create", auth, validateResource(CreateLoanSchema), createLoan);

router.post(
  "/create-loan-existingbio",
  auth,
  validateResource(CreateLoanExistingSchema),
  createLoan
);

router.post(
  "/calculate",
  auth,
  validateResource(CalculateLoanPaymentScheduleSchema),
  calculateLoanRepaymentSchedule
);

// router.post("/save_okra_customer", auth, saveOkraCustomer);

router.get("/types", auth, getLoanTypes);
router.get("/duration", auth, getLoanDurations);
router.get("/categories", auth, getLoanCategories);

router.get("/check-user-loan", auth, checkIfUserHasLoan);
// router.get("/check-loan-bio", auth, checkIfUserHasLoanBio);
router.post(
  "/appeal-loan",
  auth,
  validateResource(AppealLoanSchema),
  appealLoan
);
router.post(
  "/loan-eligibility",
  auth,
  validateResource(ComputeLoanEligibilitySchema),
  computeLoanEligibility
);

router.post(
  "/liquidate",
  auth,
  validateResource(LiquidateLoanSchema),
  liquidateLoan
);
router.get("/loan-repayment-schedule/:loanId", auth, getLoanRepaymentSchedule);
router.post(
  "/loan-due-payment",
  auth,
  validateResource(LoanDuePaymentSchema),
  loanDuePayment
);

export default router;
