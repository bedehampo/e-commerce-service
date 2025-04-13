import express from "express";
import { checkPermission } from "../../middlewares/checkPermission";
// import { addDeliveryMerchant } from "../../controllers/adminControllers/adminShopController";
import validateResource from "../../middlewares/validateResource";
import {
	AddDeliveryMerchantSchema,
	approveShopSchema,
	declineShopSchema,
	reactivateShopSchema,
	suspendShopSchema,
} from "../../validation/shop.schema";
import {
	allOrdersAdmin,
	bestSellingCategoryAdmin,
	createShopFAQAdmin,
	createShopFAQGroup,
	getAllShopsAdmin,
	getOrderActivitiesOverview,
	getRecentOrdersAdmin,
	getShopMostRecentOrdersAdmin,
	getShopOverviewCountAdmin,
	getShopProductsAdmin,
	getShopTransactionChartAdmin,
	getShopTransactionsAdmin,
	getSingleOrderAdmin,
	getSingleShopAdmin,
	getSingleShopOrderActivitiesOverview,
	shopOverViewCardsAdmin,
	shopValueMetricAdmin,
	topMerchantsAdmin,
	topSellingProductsAdmin,
	userShopVisitMetricsAdmin,
} from "../../controllers/adminControllers/adminShopController";
import auth from "../../middlewares/auth";
import {
	authenticateAdmin,
	checkAdminPermissions,
} from "../../middlewares/adminAuthPV1";
import { AdminNewRequest } from "../../utils/interfaces";
import getShopOverviewStats from "../../services/admin/getShopOverviewStats";
import { createVendorEnquiryAdmin } from "../../controllers/adminControllers/adminVendorEnquiryController";
import { VendorEnquirySchema } from "../../validation/createCategory.schema";
import { getShopTransactions } from "../../controllers/shopController";

const router = express.Router();

router.get(
	"/shop-overview-cards",
	authenticateAdmin,
	// checkAdminPermissions(["shop_view"]),
	shopOverViewCardsAdmin
);

router.get(
	"/get-user-shop-visit-metrics",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	userShopVisitMetricsAdmin
);

router.get(
	"/get-order-activities-overview",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	getOrderActivitiesOverview
);

router.get(
	"/get-shop-overview-count",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	getShopOverviewCountAdmin
);

router.get(
	"/get-top-selling-products-admin",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	topSellingProductsAdmin
);

router.get(
	"/get-top-merchant-admin",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	topMerchantsAdmin
);

router.get(
	"/get-best-selling-category-admin",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	bestSellingCategoryAdmin
);

router.get(
	"/shop-value-metics-admin",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	shopValueMetricAdmin
);

router.get(
	"/create-shop-enquiry-admin",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	validateResource(VendorEnquirySchema),
	createVendorEnquiryAdmin
);

router.get(
	"/get-recent-orders-admin",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	getRecentOrdersAdmin
);

router.get(
	"/get-all-shop-admin",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	getAllShopsAdmin
);

router.get(
	"/get-single-shop-admin/:id",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	getSingleShopAdmin
);

router.get(
	"/get-single-shop-products-admin/:id",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	getShopProductsAdmin
);

router.get(
	"/get-shop-recent-orders-admin/:id",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	getShopMostRecentOrdersAdmin
);

router.get(
	"/get-orders-admin",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	allOrdersAdmin
);

router.get(
	"/get-single-order-admin/:id",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	getSingleOrderAdmin
);

router.get(
	"/get-single-shop-transactions-admin/:id",
	authenticateAdmin,
	// checkAdminPermissions(["shop_approve"]),
	getShopTransactionsAdmin
);

router.get(
	"/get-single-shop-transactions-chart-admin/:id",
	authenticateAdmin,
	getShopTransactionChartAdmin
);

router.get(
	"/get-single-shop-order-chart-admin/:id",
	authenticateAdmin,
	getSingleShopOrderActivitiesOverview
);


// router.post(
// 	"/create-faq-group",
// 	// authenticateAdmin,
// 	// checkAdminPermissions(["shop_approve"]),
// 	createShopFAQGroup
// );

// router.post(
// 	"/create-faq/:id",
// 	// authenticateAdmin,
// 	// checkAdminPermissions(["shop_approve"]),
// 	createShopFAQAdmin
// );

export default router;
