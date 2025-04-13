import express from "express";
import {
	returnAProduct,
	updateProductReport,
	deleteProductReport,
	getReturnProducts,
	getReturnProduct,
} from "../controllers/returnProductController";
import validateResource from "../middlewares/validateResource";
import auth from "../middlewares/auth";
import {
	ReturnProductSchema,
	UpdateReturnProductSchema,
} from "../validation/product.schema";
const router = express.Router();

router.post(
	"/report",
	auth,
	validateResource(ReturnProductSchema),
	returnAProduct
);

router.patch(
	"/update/:id",
	auth,
	validateResource(UpdateReturnProductSchema),
	updateProductReport
);
router.delete("/delete/:id", auth, deleteProductReport);

router.get("/all", auth, getReturnProducts);

router.get("/:id", auth, getReturnProduct);

export default router;
