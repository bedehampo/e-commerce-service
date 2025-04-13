import express from "express";

import {
  addTermsOfService,
  deleteTermOfService,
  editTermOfService,
  getAllTermsOfService,
  getSingleTermOfService,
} from "../controllers/termsOfServiceController";
import validateResource from "../middlewares/validateResource";
import { CreateTermSchema, EditTermSchema } from "../validation/TermOfService.schema";

const router = express.Router();

// Add terms of service
router.post("/", validateResource(CreateTermSchema), addTermsOfService);

// Get single term
router.get("/:id", getSingleTermOfService);

// Edit term of service
router.patch("/:id", validateResource(EditTermSchema), editTermOfService);



// Delete term of service
router.delete('/:id', deleteTermOfService);

// Get all terms of service
router.get("/", getAllTermsOfService);

export default router;
