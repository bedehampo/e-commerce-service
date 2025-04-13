import express from "express";
import validateResource from "../../middlewares/validateResource";
import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
import { checkPermission } from "../../middlewares/checkPermission";
import {
	dealDashboard,
	getDealsAdmin,
	getDealStats,
	getSingleDealAdmin,
} from "../../controllers/adminControllers/adminDealController";

const router = express.Router();

router.get("/dash-board", authenticateAdmin, dealDashboard);
router.get("/get-deals", authenticateAdmin, getDealsAdmin);
router.get(
	"/get-deal-stats/:year",
	authenticateAdmin,
	getDealStats
);
router.get(
	"/get-single-deal/:dealId",
	authenticateAdmin,
	getSingleDealAdmin
);

export default router;
