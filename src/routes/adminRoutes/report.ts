import express from "express";
import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
import {
	createShopReport,
	deleteShopReport,
	getShopReports,
	getSingleShopReport,
	updateShopReport,
} from "../../controllers/adminControllers/adminReportController";
import { checkPermission } from "../../middlewares/checkPermission";
import validateResource from "../../middlewares/validateResource";
import {
	CreateShopReportSchema,
	UpdateShopReportSchema,
} from "../../validation/report.schema";

const router = express.Router();

router.post(
	"/",
	authenticateAdmin,
	checkPermission("shop-product-reports"),
	validateResource(CreateShopReportSchema),
	createShopReport
);

router.patch(
	"/:id",
	authenticateAdmin,
	checkPermission("shop-product-reports"),
	validateResource(UpdateShopReportSchema),
	updateShopReport
);

router.delete(
	"/:id",
	authenticateAdmin,
	checkPermission("shop-product-reports"),
	deleteShopReport
);

router.get(
	"/",
	authenticateAdmin,
	checkPermission("shop-product-reports"),
	getShopReports
);

router.get(
	"/:id",
	authenticateAdmin,
	checkPermission("shop-product-reports"),
	getSingleShopReport
);

export default router;
