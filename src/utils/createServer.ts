import compression from "compression";
import cookieparser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import session, { SessionOptions } from "express-session";
import { connectDB } from "../config/db";
import {
	errorHandler,
	notFoundHandler,
} from "../middlewares/errors";
// import accountRoutes from "../routes/accounts";
// import authRoutes from "../routes/auth";
import categoryRoutes from "../routes/adminRoutes/category";
import eventRoutes from "../routes/event";
import loanRoutes from "../routes/loan";
// import {
//   default as lockedFundRoutes,
//   default as lockedFundsRoutes,
// } from "../routes/lockedfunds";
// import postRoutes from "../routes/posts";
import productRoutes from "../routes/product";
import dealRoutes from "../routes/deal";
// import savingTargetRoutes from "../routes/savingsTarget";
import shopRoutes from "../routes/shop";
// import chatRoute from './routes/chat';
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../config/swagger";
import scheduleCancelPendingTransactions from "../jobs/cancelPendingTransactions";
// // import chatRoute from './routes/chat';
// import transactionRoutes from "../routes/transaction";
import termsOfServiceRoutes from "../routes/termsOfService";
// import userRoutes from "../routes/user";

import wishListRoutes from "../routes/wishlist";
// import hasHTagRoutes from "../routes/hashtag";
import orderRoutes from "../routes/order";
import userSavedAddressRoutes from "../routes/userDeliveryAddress";
import chatBotRoutes from "../routes/chatbot";
import cartRoutes from "../routes/cart";
import DisputeRoutes from "../routes/dispute";
import adminRoutes from "../routes/adminRoutes/index";
import ShopProductReportRoutes from "../routes/reportShops";
import ReturnProductRoutes from "../routes/returnProduct";

// import { validatePin } from "../middlewares/checkPinMiddleware";
//import storyRoutes from "../routes/story";

// // Admin
// import AdminShopPermissionRoutes from "../routes/adminRoutes/shopPermission";

// import AdminUserRoutes from "../routes/adminRoutes/adminUser";
// import adminRoleRoutes from "../routes/adminRoutes/adminRole";
// import AdminAuthRoutes from "../routes/adminRoutes/adminAuth";
// import AdminPermissionRoutes from "../routes/adminRoutes/adminPermission";
// import AdminFaqRoutes from "../routes/adminRoutes/adminFaq";
// import AdminLoanRoutes from "../routes/adminRoutes/adminLoan";
// import AdminProduct from "../routes/adminRoutes/adminProduct";
// import AdminPlatformRoutes from "../routes/adminRoutes/adminPlatformConfigs";
import AdminShopRoutes from "../routes/adminRoutes/adminShop";
// import scheduleNotifyUsersOfOverdueLoans, {
//   schedulePreDueDateLoanWarning,
// } from "../jobs/notifyUsersOfOverdueLoans";
// import highlightRoutes from "../routes/highlights";

import webhookRoutes from "../routes/webhooks";

import getSwaggerDoc from "../config/swagger";
import swaggerDocs from "../config/swagger";
// import scheduleInventoryManagement from "../jobs/lowStockThresholdCheck";
// import scheduleLowStockThresholdCheck from "../jobs/lowStockThresholdCheck";
import checkCartItemsReorderLevel from "../jobs/checkCartItemsReorderLevel";
import corsOptions from "../config/corsOptions";
import handleSocket from "../socket";
import socketAuthMiddleware from "../socket/middleware/auth";

function createServer() {
	// Express setup
	const app = express();

	// const wss = new WebSocket.Server({ server });

	// Schedule the CRON job to cancel pending transactions
	scheduleCancelPendingTransactions();
	checkCartItemsReorderLevel();
	scheduleCancelPendingTransactions();
	checkCartItemsReorderLevel();
	// scheduleLowStockThresholdCheck();
	// scheduleNotifyUsersOfOverdueLoans();
	// schedulePreDueDateLoanWarning();

	// Middlewares
	app.use(cors(corsOptions));
	app.use(express.urlencoded({ extended: false }));
	app.use(express.json());
	app.use(compression());
	app.use(cookieparser());
	// app.use(compression());
	// app.use(cookieparser());
	app.use(
		session({
			secret: process.env.MOTOPAY_SECRET,
			resave: false,
			saveUninitialized: false,
		} as SessionOptions)
	);
	app.get("/", (req: any, res: any) => {
		res.json({
			msg: "Welcome to Motopay API...",
		});
	});

	app.use(
		session({
			secret: process.env.MOTOPAY_SECRET,
			resave: false,
			saveUninitialized: false,
		} as SessionOptions)
	);

	// app.use((req, res, next) => {
	//   res.header("Access-Control-Allow-Origin", "*");
	//   res.header(
	//     "Access-Control-Allow-Headers",
	//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
	//   );
	//   if (req.method == "OPTIONS") {
	//     res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
	//     return res.status(200).json({});
	//   }

	//   next();
	// });

	app.get("/", (req: Request, res: any) => {
		res.json({
			msg: "Motopay Monolith Backend...",
		});
	});

	// Serve static files from the "public" directory
	app.use("/public", express.static("public"));

	// Define routes
	// app.use("/api/auth", authRoutes);
	// app.use("/api/users", userRoutes);
	app.use("/api/loan", loanRoutes);
	app.use("/api/event", eventRoutes);
	app.use("/api/shop", shopRoutes);
	app.use("/api/chatbot", chatBotRoutes);
	//  app.use("/api/admin-shop", AdminShopRoutes);
	// app.use("/api/accounts", accountRoutes);
	// app.use("/api/lockedfund", lockedFundsRoutes);
	// app.use("/api/savingtarget", savingTargetRoutes);
	// app.use("/api/posts", postRoutes);
	// // app.use('/api/chat', chatRoute);
	app.use("/api/product", productRoutes);
	app.use("/api/category", categoryRoutes);
	app.use("/api/wishlist", wishListRoutes);
	app.use("/api/deal", dealRoutes);
	app.use("/api/return-product", ReturnProductRoutes);
	app.use(
		"/api/user-saved-address",
		userSavedAddressRoutes
	);
	// app.use("/api/transactions", transactionRoutes);
	// app.use("/api/order", orderRoutes);
	app.use("/api/cart", cartRoutes);
	app.use("/api/terms-of-service", termsOfServiceRoutes);
	app.use(
		"/api/report-shop-product",
		ShopProductReportRoutes
	);
	// app.use("/api/hashtag", hasHTagRoutes);
	// app.use("/api/terms-of-service", termsOfServiceRoutes);
	// app.use("/api/hashtag", hasHTagRoutes);
	app.use("/api/order", orderRoutes);
	// app.use("/api/cart", cartRoutes);
	app.use("/api/dispute", DisputeRoutes);
	// app.use("/api/stories", storyRoutes);

	app.use("/api/admin", adminRoutes);

	app.use("/api/webhook", webhookRoutes);

	app.use(
		"/api-docs",
		swaggerUi.serve,
		swaggerUi.setup(swaggerDocument)
	);

	app.use(notFoundHandler);
	app.use(errorHandler);

	return app;
}

export default createServer;
