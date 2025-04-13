import express from "express";
import {
  confirmDelivery,
  dellyManWebhookHandler,
  kwikConfirmDelivery,
} from "../controllers/webhook/orders";
import {
  LoanBalanceUpdateSchema,
  MandateCreatedSchema,
  RecovaSmsAlertSchema,
} from "../validation/loan.schema";
import validateResource from "../middlewares/validateResource";
import {
  recovaLoanBalanceUpdate,
  recovaMandateCreated,
  recovaSMSAlert,
} from "../controllers/webhook/recova";

const router = express.Router();

// Log in user
// router.post("/", handleOkraCreateCustomer);

//confirm delivery
router.post("/orion", confirmDelivery);
router.post("/gig", confirmDelivery);
router.post("/kwik", kwikConfirmDelivery);
router.post("/dellyman", dellyManWebhookHandler);

//recova webhooks
router.post(
  "/recova/sms_alert",

  validateResource(RecovaSmsAlertSchema),
  recovaSMSAlert
);
router.post(
  "/recova/mandate_created",
  validateResource(MandateCreatedSchema),
  recovaMandateCreated
);
router.post(
  "/recova/loan_balance_update",
  validateResource(LoanBalanceUpdateSchema),
  recovaLoanBalanceUpdate
);

export default router;
