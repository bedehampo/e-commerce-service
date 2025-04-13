import express from "express";
import validateResource from "../middlewares/validateResource";
import auth from "../middlewares/auth";

import {
	createshop,
	getShops,
	updateCategory,
	createShopList,
	updateShopList,
	deleteShopList,
	getShopLists,
	addShopListToProduct,
	removeShopListFromProduct,
	updateShop,
	getCategories,
	filterShops,
	followAndUnfollowShop,
	getShop,
	deleteShop,
	getFollowedShops,
	getLoggedInUserShopProducts,
	getSingleShop,
	getStates,
	getLocalGovernments,
	getInventory,
	adjustPrices,
	// shop permission and membership routes
	getShopPermissions,
	getShopPermission,
	sendShopInvite,
	viewShopMembers,
	viewShopMember,
	acceptOrRejectShopInvite,
	viewMemberships,
	viewMembership,
	addPermission,
	removePermission,
	removeShopMember,
	exitShop,
	uploadBackGroundImage,
	// shop management routes
	updateShopName,
	updateShopDesc,
	updateShopContactInfo,
	enableEmailNotification,
	enablePushNotification,
	getSelfHelp,
	// miscellaneous
	// populateColor,
	getColours,
	getColour,
	updateShopLogo,
	updateShopLocation,

	// Seller score Metric
	getSellerScoreSystem,
	viewMyShopActivities,
	productSegmentations,
	mostSoldProducts,
	leastSoldProducts,
	mostReviewedProducts,
	highQualityProducts,
	customerWishProducts,
	trendingProducts,
	getShopActivityLogs,
	getShopTransactions,
	amountSuggestionRange,
	sendEnquiry,
	getVendorEnquiryGroup,
	getVendorEnquiryType,
	getMyEnquiries,
	getUserBasicInfo,
	getShopFAQs,
} from "../controllers/shopController";

import {
	AdjustPriceSchema,
	CreateShopSchema,
	FilterShopSchema,
	UpdateShopContactInfoSchema,
	UpdateShopDescSchema,
	UpdateShopLocationSchema,
	UpdateShopNameSchema,
	UpdateShopSchema,
} from "../validation/shop.schema";
import { authenticateAdmin } from "../middlewares/adminAuthPV1";
import { checkPermission } from "../middlewares/checkPermission";
import { uploadImage } from "../middlewares/upload";
import { CreateCategorySchema } from "../validation/createCategory.schema";
// import { CreateCategorySchema } from "../validation/createCategory.schema";

const router = express.Router();

// router.post("/add-colors", auth, populateColor);
router.get("/get-basic-info", auth, getUserBasicInfo);
router.get("/get-colours", auth, getColours);
router.get("/get-colour/:id", auth, getColour);
router.post("/shoplist", auth, createShopList);
router.patch("/shoplist/:shoplistID", auth, updateShopList);
router.delete(
	"/shoplist/:shoplistID",
	auth,
	deleteShopList
);
router.get("/shoplist", auth, getShopLists);
router.patch("/add-shoplist", auth, addShopListToProduct);
router.patch("/remove", auth, removeShopListFromProduct);

router.get("/", auth, getShops);
router.get("/me", auth, getShop);
router.get("/single/:id", auth, getSingleShop);
router.delete("/me", auth, deleteShop);

router.post(
	"/",
	auth,
	// uploadImage.single("file"),
	validateResource(CreateShopSchema),
	createshop
);
router.patch(
	"/background_image_upload",
	auth,
	// uploadImage.single("file"),pshop
	uploadBackGroundImage
);
router.patch(
	`/category/:id`,
	[auth, validateResource(CreateCategorySchema)],
	updateCategory
);

router.post(
	"/search",
	auth,
	validateResource(FilterShopSchema),
	filterShops
);

router.patch(
	"/me",
	auth,
	validateResource(UpdateShopSchema),
	updateShop
);

router.patch(
	"/update-shop-loc",
	auth,
	validateResource(UpdateShopLocationSchema),
	updateShopLocation
);


router.get("/category", auth, getCategories);

router.patch(
	"/follow-shop/:shopId",
	auth,
	followAndUnfollowShop
);
router.get("/followings", auth, getFollowedShops);

router.get(
	"/shop-products/me",
	auth,
	getLoggedInUserShopProducts
);
router.get("/inventory/:shopId", auth, getInventory);

router.get("/states", auth, getStates);

router.get("/states/:stateId", auth, getLocalGovernments);
// shop permission and membership routes
router.get(
	"/shop-permission/get-all-shop-permissions",
	auth,
	getShopPermissions
);
router.get(
	"/shop-permission/get-all-shop-permissions/:permissionId",
	auth,
	getShopPermission
);
router.patch(
	"/shop-permission/send-invite",
	auth,
	sendShopInvite
);
router.get(
	"/shop-permission/get-shop-members",
	auth,
	viewShopMembers
);
router.get(
	"/shop-permission/get-shop-member/:shopMemberId",
	auth,
	viewShopMember
);

router.patch(
	"/shop-permission/accept-reject-invite",
	auth,
	acceptOrRejectShopInvite
);

router.get(
	"/shop-permission/user-shops",
	auth,
	viewMemberships
);
router.get(
	"/shop-permission/user-shops/:shopMemberId",
	auth,
	viewMembership
);
router.patch(
	"/shop-permission/add-permission",
	auth,
	addPermission
);
router.patch(
	"/shop-permission/remove-permission",
	auth,
	removePermission
);
router.patch(
	"/shop-permission/delete-member/:id",
	auth,
	removeShopMember
);
router.patch(
	"/shop-permission/exit-shop/:id",
	auth,
	exitShop
);
router.patch(
	"/settings/adjust_prices",
	auth,
	validateResource(AdjustPriceSchema),
	adjustPrices
);
router.patch(
	"/shop-setting/update-name",
	auth,
	validateResource(UpdateShopNameSchema),
	updateShopName
);
router.patch(
	"/shop-setting/update-desc",
	auth,
	validateResource(UpdateShopDescSchema),
	updateShopDesc
);
router.patch(
	"/shop-setting/update-contact-info",
	auth,
	validateResource(UpdateShopContactInfoSchema),
	updateShopContactInfo
);
router.patch(
	"/shop-setting/enable-email-notification",
	auth,
	enableEmailNotification
);

router.patch(
	"/shop-setting/enable-push-notification",
	auth,
	enablePushNotification
);
router.get("/self-help/all", auth, getSelfHelp);

router.patch("/update-shop-logo", auth, updateShopLogo);

router.get(
	"/get-seller-score/:id",
	auth,
	getSellerScoreSystem
);

router.get(
	"/view-my-shop-activities",
	auth,
	viewMyShopActivities
);

router.get(
	"/product-segments/:id",
	auth,
	productSegmentations
);

router.get(
	"/most-sold-products/:id",
	auth,
	mostSoldProducts
);

router.get(
	"/least-sold-products/:id",
	auth,
	leastSoldProducts
);

router.get(
	"/most-reviewed-products/:id",
	auth,
	mostReviewedProducts
);

router.get(
	"/high-quality-products/:id",
	auth,
	highQualityProducts
);

router.get(
	"/customer-wish-products/:id",
	auth,
	customerWishProducts
);

router.get(
	"/trending-products/:id",
	auth,
	trendingProducts
);

router.get("/shop-logs", auth, getShopActivityLogs);

router.get("/shop-transactions", auth, getShopTransactions);
router.post(
	"/amount-suggestion",
	auth,
	amountSuggestionRange
);

router.post(
	"/amount-suggestion",
	auth,
	amountSuggestionRange
);

router.get(
	"/get-enquiry-group",
	auth,
	getVendorEnquiryGroup
);

router.get(
	"/get-enquiry-group",
	auth,
	getVendorEnquiryGroup
);

router.get(
	"/get-enquiry-group/:id",
	auth,
	getVendorEnquiryType
);

router.post("/send-enquiry", auth, sendEnquiry);

router.get("/get-enquiries", auth, getMyEnquiries);

router.get("/get-shop-faqs", auth, getShopFAQs);

export default router;
