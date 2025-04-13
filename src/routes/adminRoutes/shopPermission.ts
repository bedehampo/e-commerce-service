import express from "express";
import { checkPermission } from "../../middlewares/checkPermission";
import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
import auth from "../../middlewares/auth";

import {
	// Admin endpoints
	createShopPermission,
	updateShopPermission,
	deleteShopPermission,
	getAllShopPermissionsAdmin,
	getSingleShopPermissionAdmin,
	viewShopMembers,
} from "../../controllers/adminControllers/shopPermissionController";

import {
	CreateShopPermissionSchema,
	SendShopInviteSchema,
} from "../../validation/shopPermission.schema";
import validateResource from "../../middlewares/validateResource";
const router = express.Router();

// // Admin routes
router.post(
	"/create",
	authenticateAdmin,
	// checkPermission("shop-permission"),
	validateResource(CreateShopPermissionSchema),
	createShopPermission
);

router.patch(
	"/update/:permissionId",
	authenticateAdmin,
	checkPermission("shop-permission"),
	updateShopPermission
);

router.delete(
	"/delete/:permissionId",
	authenticateAdmin,
	checkPermission("shop-permission"),
	deleteShopPermission
);

router.get(
	"/get-all",
	authenticateAdmin,
	checkPermission("shop-permission"),
	getAllShopPermissionsAdmin
);

router.get(
	"/get-single-permission/:permissionId",
	authenticateAdmin,
	checkPermission("shop-permission"),
	getSingleShopPermissionAdmin
);

router.get(
	"/view-members/:id",
	authenticateAdmin,
	checkPermission("shop-permission"),
	viewShopMembers
);

export default router;
