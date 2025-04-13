import express from "express";
import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
import {
	createDisputeReason,
	deleteDisputeReason,
	editDisputeReason,
	getDisputeReasons,
	getSingleDisputeReason,
} from "../../controllers/adminControllers/adminDisputeController";
import validateResource from "../../middlewares/validateResource";
import { DisputeReasonSchema } from "../../validation/dispute.schema";
import { checkPermission } from "../../middlewares/checkPermission";

const router = express.Router();

router.post(
	"/create-dispute-reason",
	authenticateAdmin,
	checkPermission("dispute"),
	validateResource(DisputeReasonSchema),
	createDisputeReason
);

router.patch(
	"/edit-dispute-reason",
	authenticateAdmin,
	checkPermission("dispute"),
	editDisputeReason
);

router.delete(
	"/delete-dispute-reason/:id",
	authenticateAdmin,
	checkPermission("dispute"),
	deleteDisputeReason
);

router.get(
	"/get-dispute-reasons",
	authenticateAdmin,
	checkPermission("dispute"),
	getDisputeReasons
);

router.get(
	"/get-dispute-reason/:id",
	authenticateAdmin,
	checkPermission("dispute"),
	getSingleDisputeReason
);

export default router;
