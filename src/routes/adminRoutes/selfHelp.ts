import express from "express";
import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
import {
	createSelfHelp,
	deleteSelfHelp,
	editSelfHelp,
	getAllSelfHelpAdmin,
	getSelfHelpAdmin,
} from "../../controllers/adminControllers/adminShopSelfHelpController";
import { checkPermission } from "../../middlewares/checkPermission";
import validateResource from "../../middlewares/validateResource";
import {
	EditSelfHelpSchema,
	SelfHelpSchema,
} from "../../validation/selfHelp.schema";
const router = express.Router();

router.post(
	"/create",
	authenticateAdmin,
	checkPermission("self-help"),
	validateResource(SelfHelpSchema),
	createSelfHelp
);

router.patch(
	"/edit",
	authenticateAdmin,
	checkPermission("edit-self-help"),
	validateResource(EditSelfHelpSchema),
	editSelfHelp
);

router.delete(
	"/delete/:id",
	authenticateAdmin,
	checkPermission("delete-self-help"),
	deleteSelfHelp
);

router.get(
	"/get-all",
	authenticateAdmin,
	checkPermission("self-help"),
	getAllSelfHelpAdmin
);

router.get(
	"/get-single/:id",
	authenticateAdmin,
	checkPermission("self-help"),
	getSelfHelpAdmin
);

export default router;
