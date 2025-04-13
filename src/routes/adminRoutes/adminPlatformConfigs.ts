import express from "express";
import { checkPermission } from "../../middlewares/checkPermission";
import {
  addPlatformConfigs,
  getPlatformConfigs,
  updatePlatformConfigs,
} from "../../controllers/adminControllers/adminPlatformConfigController";
import validateResource from "../../middlewares/validateResource";
import {
  AddPlatformConfigSchema,
  UpdatePlatformConfigSchema,
} from "../../validation/platformConfig.schema";

const router = express.Router();
router.get("/", getPlatformConfigs);
router.post("/", validateResource(AddPlatformConfigSchema), addPlatformConfigs);
router.patch(
  "/:id",
  validateResource(UpdatePlatformConfigSchema),
  updatePlatformConfigs
);

export default router;
