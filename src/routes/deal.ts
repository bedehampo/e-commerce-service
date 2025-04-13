import express from "express";
import auth from "../middlewares/auth";
import {
	createDeal,
	dealRequest,
	acceptRequest,
	rejectRequest,
	getDeals,
	getSingleDeal,
	recentDeals,
	nearByDeals,
	myDeals,
	mySingleDeal,
	deleteMyDeal,
	viewMySentRequests,
	viewMySingleSentRequest,
	updateMyDeal,
	viewMyReceivedRequest,
	viewMySingleReceivedRequest,
	updateMyRequest,
	deleteMyRequest,
	calculateDeliveryPrice,
	initiateDealPayment,
	completeDealPayment,
} from "../controllers/dealController";
// admin middlewares
import { authenticateAdmin } from "../middlewares/adminAuthPV1";
import { checkPermission } from "../middlewares/checkPermission";
import validateResource from "../middlewares/validateResource";
import {
	CalculateDeliverySchema,
	CompleteDealPaymentSchema,
	CreateDealSchema,
	DealRequestSchema,
	InitiateDealPaymentSchema,
	UpdateDealSchema,
} from "../validation/deal.schema";
import { validateRequest } from "twilio/lib/webhooks/webhooks";
import { upload } from "../middlewares/upload";

const router = express.Router();

router.post(
	"/create",
	auth,
	// upload.array("files"),
	validateResource(CreateDealSchema),
	createDeal
);
router.post(
	"/request/create",
	auth,
	validateResource(DealRequestSchema),
	dealRequest
);
router.patch("/request/accept/:id", auth, acceptRequest);
router.patch("/request/reject/:id", auth, rejectRequest);
router.get("/find/all", auth, getDeals);
router.get("/find/single/:id", auth, getSingleDeal);
router.get("/find/recent", auth, recentDeals);
router.get("/find/nearby", auth, nearByDeals);
router.get("/find/mydeals", auth, myDeals);
router.get("/find/mydeal/:id", auth, mySingleDeal);
router.patch("/mydeal/delete/:id", auth, deleteMyDeal);
router.get(
	"/find/request/single/:id",
	auth,
	viewMySingleSentRequest
);
router.get("/find/request/all", auth, viewMySentRequests);
router.patch(
	"/mydeal/update",
	auth,
	// upload.array("files"),
	validateResource(UpdateDealSchema),
	updateMyDeal
);
router.get(
	"/find/received-request",
	auth,
	viewMyReceivedRequest
);
router.get(
	"/find/received-request/single/:id",
	auth,
	viewMySingleReceivedRequest
);
router.patch("/myrequest/update", auth, updateMyRequest);
router.patch(
	"/myrequest/delete/:id",
	auth,
	deleteMyRequest
);
router.post(
	"/calculate_delivery_price",
	auth,
	validateResource(CalculateDeliverySchema),
	calculateDeliveryPrice
);

router.post(
	"/initiate_payment",
	auth,
	validateResource(InitiateDealPaymentSchema),
	initiateDealPayment
);
router.post(
	"/complete_payment",
	auth,
	validateResource(CompleteDealPaymentSchema),
	completeDealPayment
);

export default router;
