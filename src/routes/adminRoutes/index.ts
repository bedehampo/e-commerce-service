import express from "express";
import AdminShopRoutes from "../adminRoutes/adminShop";
import AdminProductRoutes from "../adminRoutes/adminProduct";
// import AdminLoanRoutes from "../adminRoutes/adminLoan";
import ShopPermission from "../adminRoutes/shopPermission";
import SelfHelpRoutes from "../adminRoutes/selfHelp";
import AdminOrderRoutes from "../adminRoutes/adminOrder";
import adminDealRoutes from "../../routes/adminRoutes/adminDeal";
import AdminDisputeReasonRoutes from "../adminRoutes/adminDisputeReason";
import AdminShopReport from "../adminRoutes/report";
import AdminReturnProductPolicyRoutes from "../adminRoutes/adminReturnProductPolicy";
import AdminShopNotificationRoutes from "../adminRoutes/adminShopNotification";
import AdminPlatformRoutes from "../adminRoutes/adminPlatformConfigs";
import { checkJwt } from '../../middlewares/sso';


const router = express.Router();

// Use the JWT middleware
// router.use(checkJwt);

// Admin
// router.use("/api/admin/user", AdminUserRoutes);
// router.use("/api/admin/auth", AdminAuthRoutes);
// router.use("/api/admin/role", adminRoleRoutes);
// router.use("/api/admin/permission", AdminPermissionRoutes);
// router.use("/api/admin/faq", AdminFaqRoutes);
// router.use("/loan", AdminLoanRoutes);
// router.use("/order", AdminOrderRoutes);
router.use("/deal", adminDealRoutes);

// router.use("/api/highlights", highlightRoutes);
router.use("/platform", AdminPlatformRoutes);
router.use("/shop", AdminShopRoutes);
router.use("/product", AdminProductRoutes);
router.use("/shop-permission", ShopPermission);
router.use("/self-help", SelfHelpRoutes);
router.use("/dispute-reason", AdminDisputeReasonRoutes);
router.use("/shop-report", AdminShopReport);
router.use(
	"/return-product-policy",
	AdminReturnProductPolicyRoutes
);
router.use(
	"/shop-notification",
	AdminShopNotificationRoutes
);

// router.use("/api/admin/shop-permission", AdminShopPermissionRoutes);

export default router;
