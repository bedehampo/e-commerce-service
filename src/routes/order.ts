import express from "express";
import validateResource from "../middlewares/validateResource";
import auth from "../middlewares/auth";
import {
	acceptOrRejectOrder,
	calculateDeliveryPrice,
	completeOrder,
	getDeliveryMerchants,
	getOrderGroupsByUser,
	getOrdersByShop,
	getOrdersByUser,
	getSingleOrderByShop,
	getSingleOrderByUser,
	initiateOrder,
	markOrderDelivered,
	// Admin endpoints
	// getOrdersAdmin,
	// getOrderStatsAdmin,
	trackOrder,
	viewRecentlyPurchasedItem,
	getShopCustomerSegmentation,
	getSingleShopCustomerSegmentation,
	changeOrderStatusForQA,
	readyForShipping,
	newGetOrderByShop,
	newGetSingleOrderByShop,
	rejectOrderReasons,
	rejectOrderReason,
	newGetOrderByUser,
	newGetSingleOrderByUser,
} from "../controllers/orderscontroller";
import {
	CalculateDeliverySchema,
	CreateBNPLSchema,
	EditBNPLSchema,
	InitiateOrderSchema,
	acceptOrRejectOrderSchema,
	completeOrderSchema,
} from "../validation/order.schema";
import { authenticateAdmin } from "../middlewares/adminAuthPV1";
import { checkPermission } from "../middlewares/checkPermission";
import {
	checkActiveBNPL,
	createBNPL,
	editBNPL,
	fullBnplPayment,
	getAllUserBNPL,
	getUserSingleBNPL,
	initiateBNPLPayment,
	partialBnplPayment,
	viewBNPLSummary,
} from "../controllers/bnpl.controller";

const router = express.Router();

router.post(
	"/initiate",
	auth,
	validateResource(InitiateOrderSchema),
	initiateOrder
);
router.post(
	"/complete",
	auth,
	validateResource(completeOrderSchema),
	completeOrder
);
router.post(
	"/calculate_delivery",
	auth,
	validateResource(CalculateDeliverySchema),
	calculateDeliveryPrice
);

router.get("/customer", auth, getOrdersByUser);

router.get("/shop/:shopId", auth, newGetOrderByShop);

router.patch(
	"/shop/status/:shopId/:orderId",
	auth,
	validateResource(acceptOrRejectOrderSchema),
	acceptOrRejectOrder
);

router.get("/rejection-reasons", auth, rejectOrderReasons);
router.get(
	"/rejection-reasons/:id",
	auth,
	rejectOrderReason
);

router.get(
	"/customer/single/:orderId",
	auth,
	getSingleOrderByUser
);

router.get(
	"/shop/single/:orderId/:shopId",
	auth,
	newGetSingleOrderByShop
);

// Mark order delivered
router.get("mark-delivered", auth, markOrderDelivered);

// router.get("/order_status_kwik", auth, getOrderStatusKwik);

router.get("/shop/single/:id", auth, getSingleOrderByShop);

router.get(
	"/customer/order_group",
	auth,
	getOrderGroupsByUser
);

router.get(
	"/delivery_merchants",
	auth,
	getDeliveryMerchants
);

// router.get("/admin", authenticateAdmin, getOrdersAdmin);
// router.get(
// 	"/admin/stats/:year",
// 	authenticateAdmin,
// 	checkPermission("orders"),
// 	getOrderStatsAdmin
// );

router.post(
	"/create-bnpl",
	auth,
	validateResource(CreateBNPLSchema),
	createBNPL
);

router.patch(
	"/edit-bnpl/:id",
	auth,
	validateResource(EditBNPLSchema),
	editBNPL
);

router.get("/view-bnpl-summary/:id", auth, viewBNPLSummary);

router.post(
	"/initiate-bnpl/:id",
	auth,
	initiateBNPLPayment
);

router.get("/get-user-bnpl-records", auth, getAllUserBNPL);

router.get(
	"/get-user-bnpl-records/:id",
	auth,
	getUserSingleBNPL
);

router.patch(
	"/initiate-payment/partial/:id",
	auth,
	partialBnplPayment
);

router.patch(
	"/initiate-payment/full/:id",
	auth,
	fullBnplPayment
);

router.get("/track_order", auth, trackOrder);

router.get(
	"/recently-purchased",
	auth,
	viewRecentlyPurchasedItem
);
router.get("/active-bnpl", auth, checkActiveBNPL);

router.get(
	"/get-customer-segmentation/:shopId",
	auth,
	getShopCustomerSegmentation
);

router.get(
	"/get-single-customer-segment/:shopId",
	auth,
	getSingleShopCustomerSegmentation
);

router.patch(
	"/change-status/:id",
	auth,
	changeOrderStatusForQA
);

router.patch(
	"/ready-for-pickup/:id",
	auth,
	readyForShipping
);

// router.get("/track_order", authenticateAdmin, trackOrder);

export default router;
