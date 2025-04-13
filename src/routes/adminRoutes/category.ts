import express from "express";
import auth from "../../middlewares/auth";
import {
	createCategory,
	createSubCategory,
	createVariation,
	addVariationToSubCategory,
	editCategory,
	deleteCategory,
	getCategories,
	getCategoriesAdmin,
	getCategory,
	getCategoryAdmin,
	editSubCategory,
	getSubCategoriesAdmin,
	getSubCategoryAdmin,
	deleteSubCategory,
	getSingleSubCategory,
	getProductCategoryVariations,
	moveSubCategoryToCategory,
	getAllVariations,
	getSingleVariation,
	deleteVariation,
	removeVariationFromSubCategory,
	editVariation,
	createProductProperties,
	createProductVariations,
	getCategoriesAsGuest,
} from "../../controllers/adminControllers/categoryController";
import {
	CreateCategorySchema,
	CreateProductPropertySchema,
} from "../../validation/createCategory.schema";
import validateResource from "../../middlewares/validateResource";
import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
import { checkPermission } from "../../middlewares/checkPermission";
import { upload } from "../../middlewares/upload";
import { createProduct } from "../../services/product/productServices";

const router = express.Router();

// Category routes

router.post(
	"/",
	authenticateAdmin,
	// upload.single("file"),
	// checkAdminPermissions(["shop_view"]),
	validateResource(CreateCategorySchema),
	createCategory
);

router.patch(
	"/:categoryId",
	authenticateAdmin,
	// upload.single("file"),
	// checkAdminPermissions(["shop_view"]),
	editCategory
);
router.delete(
	"/:categoryId",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	deleteCategory
);

router.get("/", auth, getCategories);

router.get("/guest", getCategoriesAsGuest);

router.get(
	"/admin",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	getCategoriesAdmin
);

router.get("/:categoryId", auth, getCategory);

router.get(
	"/admin/:categoryId",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),,
	getCategoryAdmin
);

router.patch(
	"/subcategory/:subCategoryId",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	editSubCategory
);

router.get(
	"/subcategory/admin",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	getSubCategoriesAdmin
);

router.get(
	"/subcategory/admin/:id",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	getSubCategoryAdmin
);

router.get(
	"/subcategory/:subCategoryId",
	authenticateAdmin,
	checkPermission("category"),
	getSingleSubCategory
);

router.get(
	"/subcategory/variation/:subCategoryId",
	auth,
	getProductCategoryVariations
);

router.patch(
	"/move",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	moveSubCategoryToCategory
);

router.delete(
	"/subcategory/:subCategoryId",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	deleteSubCategory
);

router.post(
	"/subcategory",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	createSubCategory
);

// Variations routes
router.post(
	"/variation",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	createVariation
);

router.patch(
	"/admin/addvariation",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	addVariationToSubCategory
);

router.get(
	"/admin/variation/all",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	getAllVariations
);

router.get(
	"/admin/variation/:variationId",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	getSingleVariation
);

router.delete(
	"/admin/variation/:variationId",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	deleteVariation
);

router.patch(
	"/variation/:subCategoryId/:variationId",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	removeVariationFromSubCategory
);

router.patch(
	"/variation/edit/:variationId",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	editVariation
);

router.post(
	"/create-product-properties",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	validateResource(CreateProductPropertySchema),
	createProductProperties
);

router.post("/update-new-sub-cat", createProductVariations);

export default router;
