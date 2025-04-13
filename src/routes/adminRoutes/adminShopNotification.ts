import express from "express";
import {
	sendNotificationToShopOwners,
	sendNotificationToShopOwner,
} from "../../controllers/adminControllers/adminNotificationController";
import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
import { checkPermission } from "../../middlewares/checkPermission";
const router = express.Router();

router.post(
	"/send-shops-message",
	authenticateAdmin,
	// checkPermission("")
	sendNotificationToShopOwners
);

router.post(
	"/send-shop-message/:id",
	authenticateAdmin,
	// checkPermission()
	sendNotificationToShopOwner
);
export default router;
