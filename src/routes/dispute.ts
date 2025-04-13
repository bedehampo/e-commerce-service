import express from "express";
import auth from "../middlewares/auth";
import {
	createDispute,
	shopDisputes,
	shopSingleDispute,
	customerDisputes,
	customerSingleDisputes,
	// rejectDispute,
	// acceptDispute,
	// resolvedDispute,
	// reOpenDispute,
	// closeDispute,
	// escalateDispute,
	getDisputeReasons,
	getSingleDisputeReason,
	acceptDispute,
	rejectDispute,
} from "../controllers/disputeController";
import validateResource from "../middlewares/validateResource";
import {
	AcceptDisputeSchema,
	DisputeSchema,
	RejectDisputeSchema,
} from "../validation/dispute.schema";
import { upload } from "../middlewares/upload";
import { IDeliveryOrderInterface } from "../types/order";
const router = express.Router();

router.post(
	"/create",
	auth,
	// upload.single("file"),
	validateResource(DisputeSchema),
	createDispute
);

router.get("/shop/:id", auth, shopDisputes);
router.get(
	"/shop/single/:shopId/:disputeId",
	auth,
	shopSingleDispute
);
router.patch(
	"/shop/accept/:shopId/:disputeId",
	auth,
	acceptDispute
);
router.patch(
	"/shop/reject/:shopId/:disputeId",
	auth,
	rejectDispute
);
router.get("/customer", auth, customerDisputes);
router.get(
	"/customer/:disputeID",
	auth,
	customerSingleDisputes
);
// router.patch(
// 	"/reject",
// 	auth,
// 	validateResource(RejectDisputeSchema),
// 	rejectDispute
// );
// router.patch(
// 	"/accept",
// 	auth,
// 	validateResource(AcceptDisputeSchema),
// 	acceptDispute
// );
// router.patch("/resolve/:disputeId", auth, resolvedDispute);
// router.patch("/reopen", auth, reOpenDispute);
// router.patch("/close", auth, closeDispute);
// router.patch("/complaint", auth, escalateDispute);
router.get("/get-dispute-reasons", auth, getDisputeReasons);
router.get(
	"/get-dispute-reasons/:id",
	auth,
	getSingleDisputeReason
);

export default router;
