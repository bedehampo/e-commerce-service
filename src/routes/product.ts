import express from "express";
import auth from "../middlewares/auth";
import {
	editProduct,
	uploadProduct,
	getSingleProduct,
	getProducts,
	getShopProducts,
	deleteProduct,
	stockUpProduct,
	deleteProductWholesale,
	filterProducts,
	reviewProduct,
	getProductCategories,
	getProductHashTags,
	getProductHashTag,
	getMyShopProducts,
	getMySingleProduct,
	generateProductDesc2,
	testUploadBlodController,
	keepShoppingProducts,
	getTopProductDeals,
	flashSales,
	limitedStock,
	productsNearYou,
	getDeliveryTime,
	bigSavingProducts,
	festiveProducts,
	bestProductDealsBySubCategory,
	getAllAdminProductDealSections,
	getAdminProductDealSection,
	getApplianceDeals,
	stockDownProduct,
	getPLBanner4User,
	getPLBannerProducts,
	getProductReviews,
	getProductReviewAnalysis,
	checkForBNPLValidity,
	requestProduct,
	viewProductRequests,
	viewProductRequest,
	getTopSellingProducts,
	checkReviewProduct,
	getCountry,
	getCountries,
	stockUpProductNew,
	productsNearYouGuest,
	getTopProductDealsGuest,
	flashSalesGuest,
	getTopSellingProductsGuest,
	bigSavingProductsGuest,
	bestProductDealsBySubCategoryGuest,
	limitedStockGuest,
	getApplianceDealsGuest,
	getPLBanner4UserGuest,
	getPLBannerProductsGuest,
	festiveProductsGuest,
	getSingleProductGuest,
	getProductsGuest,
	// searchProductAutoComplete,
} from "../controllers/productsController";
import validateResource from "../middlewares/validateResource";
import {
	DeleteWholesaleSchema,
	EditProductSchema,
	GenerateProductDescSchema,
	ReviewProductSchema,
	StockUpSchema,
	// ReviewProductSchema,
	UploadProductSchema,
	GenerateProductDescSchema2,
	DeliveryTimeSchema,
	RequestProductSchema,
	StockUpNewSchema,
	// ViewProductSchema,
} from "../validation/product.schema";
import { filterProductSchema } from "../validation/filterProduct.schema";
import { upload, uploadImage } from "../middlewares/upload";

// import { checkShopPermission } from "../middlewares/checkShopPermission";

const router = express.Router();

router.get(
	"/product-categories/:shopId",
	auth,
	getProductCategories
);
router.get("/keep-shopping", auth, keepShoppingProducts);

router.get(
	"/my-shop-products/:id",
	auth,
	getMyShopProducts
);
router.get(
	"/my-single-shop-product/:shopId/:productId",
	auth,
	getMySingleProduct
);

router.post(
	"/",
	auth,
	//  uploadImage.array("files"),
	validateResource(UploadProductSchema),
	uploadProduct
);

router.get("/countries", auth, getCountries);
router.get("/countries/:id", auth, getCountry);

router.patch(
	"/edit-product",
	auth,
	validateResource(EditProductSchema),
	editProduct
);

router.patch("/view/:id", auth, getSingleProduct);

router.get("/view-guest/:id", getSingleProductGuest);

router.get("/", auth, getProducts);

router.get("/guest", getProductsGuest);

router.get(
	"/best-deals/:id",
	auth,
	bestProductDealsBySubCategory
);

router.get(
	"/best-deals-guest/:id",
	bestProductDealsBySubCategoryGuest
);

router.get(
	"/big-savings-products",
	auth,
	bigSavingProducts
);

router.get(
	"/big-savings-products-guest",
	bigSavingProductsGuest
);

router.get("/festive-products", auth, festiveProducts);

router.get("/festive-products-guest", festiveProductsGuest);

router.get("/appliance-deal", auth, getApplianceDeals);

router.get("/appliance-deal-guest", getApplianceDealsGuest);

router.get("/product-near-you", auth, productsNearYou);

router.get("/product-near-you-guest", productsNearYouGuest);

router.get("/top-deals", auth, getTopProductDeals);

router.get("/top-deals-guest", getTopProductDealsGuest);

router.get(
	"/get-sections",
	auth,
	getAllAdminProductDealSections
);

router.get(
	"/get-section/:id",
	auth,
	getAdminProductDealSection
);

router.get("/flash-sales", auth, flashSales);

router.get("/flash-sales-guest", flashSalesGuest);

router.get("/limited-stock", auth, limitedStock);

router.get("/limited-stock-guest", limitedStockGuest);

router.get("/shop-products/:shopId", auth, getShopProducts);

router.patch("/delete/:productId", auth, deleteProduct);

router.patch(
	"/stock/increase-product-stock",
	auth,
	validateResource(StockUpSchema),
	stockUpProduct
);

router.patch(
	"/stock/increase-product-stock-new",
	auth,
	validateResource(StockUpNewSchema),
	stockUpProductNew
);

router.patch(
	"/stock/decrease-product-stock",
	auth,
	validateResource(StockUpSchema),
	stockDownProduct
);

router.patch(
	"/wholesale/delete",
	auth,
	validateResource(DeleteWholesaleSchema),
	deleteProductWholesale
);
router.get(
	"/filter",
	auth,
	validateResource(filterProductSchema),
	filterProducts
);

router.get("/review/check/:id", auth, checkReviewProduct);

router.post(
	"/review",
	auth,
	validateResource(ReviewProductSchema),
	reviewProduct
);

router.get("/get-tags", auth, getProductHashTags);
router.get("/get-tag/:id", auth, getProductHashTag);

router.post(
	"/generate-product-desc2",
	auth,
	validateResource(GenerateProductDescSchema2),
	generateProductDesc2
);

router.get(
	"/get-delivery-time",
	auth,
	validateResource(DeliveryTimeSchema),
	getDeliveryTime
);

router.post(
	"/test-upload",
	auth,
	uploadImage.single("file"),
	testUploadBlodController
);

router.get("/banner", auth, getPLBanner4User);
router.get("/banner-guest", getPLBanner4UserGuest);
router.get("/banner/:id", auth, getPLBannerProducts);
router.get("/banner-guest/:id", getPLBannerProductsGuest);
router.get(
	"/get-product-reviews/:id",
	auth,
	getProductReviews
);
router.get(
	"/get-product-reviews-analysis/:id",
	auth,
	getProductReviewAnalysis
);
router.get("/bnpl-validity", auth, checkForBNPLValidity);

router.get("/bnpl-validity", auth, checkForBNPLValidity);

router.post(
	"/request-product",
	auth,
	validateResource(RequestProductSchema),
	requestProduct
);

router.get("/request-product", auth, viewProductRequests);

router.get(
	"/request-product/:id",
	auth,
	viewProductRequest
);

router.get(
	"/top-selling-products",
	auth,
	getTopSellingProducts
);

router.get(
	"/top-selling-products-guest",
	getTopSellingProductsGuest
);

// search product auto complete
// router.get(
// 	"/search-auto-complete",
// 	auth,
// 	searchProductAutoComplete
// );

// router.get(
// 	"/properties",
// 	getProductProperties
// );

export default router;
