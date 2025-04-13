import express from "express";
import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
import {
	createReturnProductPolicy,
	deleteReturnProductPolicy,
	getReturnProductPolicies,
	getReturnProductPolicy,
	updateReturnProductPolicy,
} from "../../controllers/adminControllers/adminReturnProductPolicyController";
import { checkPermission } from "../../middlewares/checkPermission";
const router = express.Router();

router.post(
	"/",
	authenticateAdmin,
	checkPermission("return-product-policy"),
	createReturnProductPolicy
);

router.patch(
	"/:id",
	authenticateAdmin,
	checkPermission("return-product-policy"),
	updateReturnProductPolicy
);

router.delete(
	"/:id",
	authenticateAdmin,
	checkPermission("return-product-policy"),
	deleteReturnProductPolicy
);

router.get(
	"/",
	authenticateAdmin,
	getReturnProductPolicies
);

router.get(
	"/:id",
	authenticateAdmin,
	getReturnProductPolicy
);

export default router;
