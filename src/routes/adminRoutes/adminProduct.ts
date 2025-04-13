import express from "express";

// import {
// 	getSingleProductAdmin,
// 	getProductsAdmin,
// } from "../../controllers/productsController";

import validateResource from "../../middlewares/validateResource";
import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
import { checkPermission } from "../../middlewares/checkPermission";
import {
	approveProduct,
	declineProduct,
	getProductsAdmin,
	getSingleProductAdmin,
	addProductToAdminPLsection,
	createCategoryProductListingSection,
	getCategoryProductListingSections,
	getCategoryProductListingSection,
	deleteCategoryProductListingSection,
	updateCategoryProductListingSection,
	createPLSectionAdmin,
	updatePLSection,
	deletePLSection,
	getAdminProductListingSections,
	getAdminProductListingSection,
} from "../../controllers/adminControllers/adminProductController";
import {
	PLPBannerSchema,
	approveProductSchema,
	declineProductSchema,
} from "../../validation/product.schema";
import {
	addProductToPLBanner,
	createPLPBanner,
	deletePLBanner,
	editPLBanner,
	getAllPLBanners,
	getSinglePLBanner,
	removeProductFromPLBanner,
} from "../../controllers/adminControllers/adminPlpBannerController";

const router = express.Router();

// Category routes

router.get(
	"/:productID",
	// checkPermission("category"),
	authenticateAdmin,
	getSingleProductAdmin
);

router.get("/", authenticateAdmin, getProductsAdmin);
router.patch(
	"/approve/:productId",
	validateResource(approveProductSchema),
	authenticateAdmin,
	checkPermission("process-product-request"),
	approveProduct
);
router.patch(
	"/decline/:productId",
	validateResource(declineProductSchema),
	authenticateAdmin,
	checkPermission("process-product-request"),
	declineProduct
);

router.post(
	"/create/pl-section",
	authenticateAdmin,
	checkPermission("process-product-request"),
	createPLSectionAdmin
);

router.patch(
	"/update/pl-section/:id",
	authenticateAdmin,
	checkPermission("process-product-request"),
	updatePLSection
);

router.delete(
	"/delete/pl-section/:id",
	authenticateAdmin,
	checkPermission("process-product-request"),
	deletePLSection
);

router.get(
	"/all/pl-section",
	authenticateAdmin,
	getAdminProductListingSections
);

router.get(
	"/single/pl-section/:id",
	authenticateAdmin,
	getAdminProductListingSection
);

router.post(
	"/admin-plp/add-to-pl",
	// checkPermission("process-product-request"),
	authenticateAdmin,
	addProductToAdminPLsection
);
router.post(
	"/create-category-product-listing-section",
	checkPermission("process-product-request"),
	authenticateAdmin,
	createCategoryProductListingSection
);

router.get(
	"/ppl/get-all-sections",
	authenticateAdmin,
	getCategoryProductListingSections
);

router.get(
	"/ppl/get-all-sections/:id",
	authenticateAdmin,
	getCategoryProductListingSection
);

router.delete(
	"/ppl/:id",
	authenticateAdmin,
	checkPermission("process-product-request"),
	deleteCategoryProductListingSection
);

router.patch(
	"/ppl/:id",
	authenticateAdmin,
	checkPermission("process-product-request"),
	updateCategoryProductListingSection
);

router.post(
	"/banner/create",
	validateResource(PLPBannerSchema),
	authenticateAdmin,
	// checkPermission("process-product-request")
	createPLPBanner
);

router.patch(
	"/banner/add-products/:id",
	authenticateAdmin,
	// checkPermission("process-product-request")
	addProductToPLBanner
);

router.patch(
	"/banner/remove-products/:id",
	authenticateAdmin,
	// checkPermission("process-product-request")
	removeProductFromPLBanner
);

router.get(
	"/banner/get-all",
	authenticateAdmin,
	getAllPLBanners
);

router.get(
	"/banner/:id",
	authenticateAdmin,
	getSinglePLBanner
);

router.patch(
	"/banner/edit-banner/:id",
	authenticateAdmin,
	// checkPermission("process-product-request")
	editPLBanner
);

router.delete(
	"/banner/:id",
	authenticateAdmin,
	// checkPermission("process-product-request")
	deletePLBanner
);

export default router;
