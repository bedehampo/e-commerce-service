import { NextFunction, Response } from "express";
import {
	AdminNewRequest,
	AdminRequest,
	CustomRequest,
	StatusTypes,
} from "../../utils/interfaces";
import { Shop } from "../../model/shop/shop";
import { Category } from "../../model/admin/category";
import { ShopMember } from "../../model/shop/shopMembers";
import { Product } from "../../model/shop/product";
import { SubCategory } from "../../model/admin/subCategory";
import { ShopAction } from "../../model/shop/shopActions";
import { checkAdminUser } from "../../middlewares/validators";
import mongoose from "mongoose";
import {
	ApproveShopInput,
	DeclineShopInput,
	SuspendShopInput,
} from "../../validation/shop.schema";
import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from "../../errors";
import sendMailNodeMailer from "../../services/mail/sendEmailNodeMailer";
import {
	shopRequestApprovedTemplate,
	shopRequestDeniedTemplate,
	shopSuspendedTemplate,
} from "../../services/mail/templates";

import {
	getAverageOrderValueByYearService,
	getAverageOrderValueStatsService,
	getGrossMerchandisValueByYearService,
	getGrossMerchandiseStatsService,
	getOrderAcceptanceRateByYearService,
	getOrderAcceptanceRateStatsByASingleShopService,
	getOrderAcceptanceRateStatsService,
	getShopOverviewStatsService,
	getShoppingCartAbandonementRateByYearService,
	getShoppingCartAbandonementRateStatsService,
} from "../../services";
import userService from "../../lib/userService";
import { IShop, ProductStatus } from "../../types/shop";
import {
	calculatePercentageDifference,
	getMonthName,
	notificationService,
	userNotificationInfo,
	userNotificationInfoBatch,
} from "../../utils/global";
import getUsersVisitsStats from "../../services/shop/getUsersVisitStats";
import { successResponse } from "../../helpers/index";
import { Deal } from "../../model/shop/deal";
import { Order } from "../../model/shop/order";
import { DeliveryMerchant } from "../../model/shop/deliveryMerchant";
import {
	startOfMonth,
	startOfWeek,
	endOfMonth,
	eachDayOfInterval,
	format,
} from "date-fns";
import {
	CartItemStatus,
	OrderPaymentStatus,
	OrderStatus,
} from "../../types/order";
import { OrderPaymentGroup } from "../../model/shop/OrderPaymentGroup";
import { limitedStock } from "../productsController";
import getShopOverviewStats from "../../services/admin/getShopOverviewStats";
import { groupBy } from "lodash";
import { Cart } from "../../model/shop/cart";
import { CartItem } from "../../model/shop/cartItem";
import { ReturnProductModel } from "../../model/shop/returnProduct";
import {
	CreateFaqGroupInput,
	CreateFaqInput,
} from "../../validation/createCategory.schema";
import { AdminShopFAQGroupModel } from "../../model/admin/vendorEnquiry";
import { AdminShopFAQModel } from "../../model/admin/VendorEnquiryType";

// Admin Controllers - shop cards
export const shopOverViewCardsAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		// Date range
		const startOfCurrentWeek = startOfWeek(new Date(), {
			weekStartsOn: 0,
		});

		// Count shops created before the current week
		const previousShopsCount = await Shop.countDocuments({
			createdAt: { $lt: startOfCurrentWeek },
		});

		// Get the total count of shops
		const currentShopCount = await Shop.countDocuments();

		// Calculate the percentage difference between previous and current shop counts
		const shopPercentageDiff =
			await calculatePercentageDifference(
				previousShopsCount,
				currentShopCount
			);

		const shopData = {
			currentShopCount,
			previousShopsCount,
			shopPercentageDiff: shopPercentageDiff,
		};

		// Get products
		const previousProductCount =
			await Product.countDocuments({
				createdAt: { $lt: startOfCurrentWeek },
			});
		const currentProductCount =
			await Product.countDocuments();

		const productPercentageDiff =
			await calculatePercentageDifference(
				previousProductCount,
				currentProductCount
			);

		const productData = {
			currentProductCount,
			previousProductCount,
			productPercentageDiff: productPercentageDiff,
		};

		// Get Orders
		const currentOrderCount = await Order.countDocuments();
		const previousOrderCount = await Order.countDocuments({
			createdAt: { $lt: startOfCurrentWeek },
		});
		const orderPercentageDiff =
			await calculatePercentageDifference(
				previousOrderCount,
				currentOrderCount
			);
		const orderData = {
			currentOrderCount,
			previousOrderCount,
			orderPercentageDiff: orderPercentageDiff,
		};

		// Get revenue
		const previousOrderForRevenue =
			await OrderPaymentGroup.find({
				paymentStatus: OrderPaymentStatus.PAID,
				createdAt: { $lt: startOfCurrentWeek },
			});
		// Get previous revenue
		const previousRevenue = previousOrderForRevenue.reduce(
			(total, order) => total + order.totalAmount,
			0
		);

		const currentOrderForRevenue =
			await OrderPaymentGroup.find({
				paymentStatus: OrderPaymentStatus.PAID,
			});
		const currentRevenue = currentOrderForRevenue.reduce(
			(total, order) => total + order.totalAmount,
			0
		);
		const revenueDiff = await calculatePercentageDifference(
			previousRevenue,
			currentRevenue
		);
		const revenueData = {
			currentRevenue: currentRevenue,
			previousRevenue: previousRevenue,
			revenueDiff: revenueDiff,
		};

		// Deliveries
		const previousDeliveriesCount =
			await Order.countDocuments({
				createdAt: { $lt: startOfCurrentWeek },
				status: OrderStatus.DELIVERED,
				paymentStatus: OrderPaymentStatus.PAID,
			});
		const currentDeliveriesCount =
			await Order.countDocuments({
				status: OrderStatus.DELIVERED,
				paymentStatus: OrderPaymentStatus.PAID,
			});
		const deliveryPercentageDiff =
			await calculatePercentageDifference(
				previousDeliveriesCount,
				currentDeliveriesCount
			);
		const deliveryData = {
			currentDeliveriesCount,
			previousDeliveriesCount,
			deliveryPercentageDiff: deliveryPercentageDiff,
		};

		return res.send(
			successResponse(
				"Shop overview card detail fetched successfully",
				{
					shopData,
					productData,
					orderData,
					revenueData,
					deliveryData,
				}
			)
		);
	} catch (error) {
		next(error);
	}
};

// Customer order analysis
export const userShopVisitMetricsAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorisation & Authentication
		req.user;

		// get all the shop
		const shops = await Shop.find();
		// Initialize counters for visits
		let totalVisits = 0;
		let totalNewVisits = 0;
		let totalReturningVisits = 0;

		// Loop through each shop to analyze visit data
		shops.forEach((shop) => {
			if (shop.shopVisitCount) {
				// Count all unique visitors
				totalVisits += shop.shopVisitCount.visitors.length;
				// Count new visits, filtering by date if specified
				shop.shopVisitCount.newVisit.forEach((newVisit) => {
					totalNewVisits += 1;
				});

				// Count returning visits, filtering by date if specified
				shop.shopVisitCount.visits.forEach(
					(returningVisit) => {
						totalReturningVisits += returningVisit.count;
					}
				);
			}
		});

		return res.send(
			successResponse(
				"Shop user visit metrics fetced successfully",
				{ totalNewVisits, totalReturningVisits }
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getOrderActivitiesOverview = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorisation & Authentication
		req.user;
		// Get and validate year and month

		let year = parseInt(req.query.year as string, 10);
		let month = parseInt(req.query.month as string, 10);

		// if not year or month are passed, use the current year and month as default
		const currentDate = new Date();
		if (!year || isNaN(year)) {
			year = currentDate.getFullYear();
		}
		if (!month || isNaN(month) || month < 1 || month > 12) {
			month = currentDate.getMonth() + 1;
		}

		// Get the start date of the month and calculate the end date
		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 1);

		// Calculate the number of days in the provided month
		const daysInMonth = new Date(year, month, 0).getDate();

		// Get all orders within the specified year and month
		const orders = await Order.find({
			createdAt: {
				$gte: startDate,
				$lt: endDate,
			},
		});

		// Count the number of orders created each day in the month
		const dailyOrderCount = Array(daysInMonth).fill(0);
		orders.forEach((order) => {
			const day = new Date(order.createdAt).getDate();
			dailyOrderCount[day - 1] += 1;
		});

		// Prepare response
		const dailyOrderSummary = dailyOrderCount.map(
			(count, index) => ({
				day: index + 1,
				orderCount: count,
			})
		);
		return res.send(
			successResponse(
				"Orders activities overview fetched successfully",
				dailyOrderSummary
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopOverviewCountAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorisation & Authentication
		req.user;

		const noOfShops = await Shop.countDocuments();
		const activeShops = await Shop.countDocuments({
			status: StatusTypes.ACTIVE,
		});

		// Get the percentage of active shops
		const activeShopPercentage = Math.round(
			(activeShops / noOfShops) * 100
		);

		// conversrion rate
		const totalPurchase = await Order.countDocuments({
			paymentStatus: OrderPaymentStatus.PAID,
		});

		let totalViews = 0;
		const products = await Product.find();
		products.forEach((product) => {
			totalViews += product.popularityScore;
		});
		const conversionRate = Math.round(
			(totalPurchase / totalViews) * 100
		);

		let costPrice = 0;
		let sellingPrice = 0;
		const paymentGroup = await OrderPaymentGroup.find();
		paymentGroup.forEach((payment) => {
			costPrice +=
				payment.subTotal +
				payment.totalDeliveryFee +
				payment.totalDiscount;
			payment;
			sellingPrice += payment.totalAmount;
		});
		console.log(costPrice, sellingPrice);

		const marginPercentage = Math.round(
			((sellingPrice - costPrice) / costPrice) * 100
		);

		const data = {
			noOfShops: noOfShops,
			activeShopPercentage: activeShopPercentage,
			conversionRate: conversionRate,
			marginPercentage: conversionRate,
		};

		return res.send(
			successResponse(
				"Shop overview stats fetched successfully",
				data
			)
		);
	} catch (error) {
		next(error);
	}
};

export const topSellingProductsAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorisation & Authentication
		req.user;
		// filter product by their dates
		// Get the top-selling products sort by quantity sold
		const products = await Product.find({
			status: {
				$in: [
					ProductStatus.VERIFIED,
					ProductStatus.OUT_OF_STOCK,
				],
			},
		})
			.populate({
				path: "shop",
				select: "brand_name",
			})
			.sort({ quantitySold: -1 });

		// Ensure the products have sold at least one product - quantitySold > 0
		const filteredProducts = products.filter(
			(product) => product.quantitySold > 0
		);

		const response = filteredProducts.map((product) => {
			return {
				_id: product._id,
				productName: product.productName,
				productImages: product.productImages,
				// @ts-ignore
				brandName: product.shop.brand_name,
				quantitySold: product.quantitySold,
				totalIncome:
					product.productPrice * product.quantitySold,
				date: product.createdAt,
			};
		});

		// Send response with the sorted product list
		return res.send(
			successResponse(
				"Top-selling products fetched successfully",
				response
			)
		);
	} catch (error) {
		next(error);
	}
};

export const topMerchantsAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorisation & Authentication
		req.user;
		// Fetch products with the specified status and populate shop and category details
		const products = await Product.aggregate([
			{
				$match: {
					status: {
						$in: [
							ProductStatus.VERIFIED,
							ProductStatus.OUT_OF_STOCK,
						],
					},
					quantitySold: { $gt: 0 },
				},
			},
			{
				$lookup: {
					from: "shops",
					localField: "shop",
					foreignField: "_id",
					as: "shopDetails",
				},
			},
			{ $unwind: "$shopDetails" },
			{
				$lookup: {
					from: "categories",
					localField: "shopDetails.category",
					foreignField: "_id",
					as: "categoryDetails",
				},
			},
			{ $unwind: "$categoryDetails" },
			{
				$group: {
					_id: "$shopDetails._id",
					brandName: { $first: "$shopDetails.brand_name" },
					category: { $first: "$categoryDetails.name" },
					userId: { $first: "$shopDetails.user" },
					totalQuantitySold: { $sum: "$quantitySold" },
					totalIncome: {
						$sum: {
							$multiply: ["$quantitySold", "$productPrice"],
						},
					},
				},
			},
			{
				$sort: { totalQuantitySold: -1 },
			},
		]);

		// Collect all unique user IDs for a batch request
		const userIds = products.map(
			(product) => product.userId
		);
		const userDetailsMap = await userNotificationInfoBatch(
			userIds
		);

		// Map user details back to each product's shop data
		const topMerchants = products.map((product) => ({
			shopId: product._id,
			brandName: product.brandName,
			merchantName: `${
				userDetailsMap[product.userId].firstName
			} ${userDetailsMap[product.userId].lastName}`,
			category: product.category,
			productSold: product.totalQuantitySold,
			commission: product.totalIncome,
		}));

		// Send response with the sorted merchant data
		return res.send(
			successResponse(
				"Top-selling merchants fetched successfully",
				topMerchants
			)
		);
	} catch (error) {
		next(error);
	}
};

export const bestSellingCategoryAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;

		// Fetch products with specified status and populate related fields
		const products = await Product.find({
			status: {
				$in: [
					ProductStatus.VERIFIED,
					ProductStatus.OUT_OF_STOCK,
				],
			},
		})
			.populate({
				path: "shop",
				select: "brand_name category",
				populate: {
					path: "category",
					select: "name icon image",
				},
			})
			.populate({
				path: "productCategory",
				select: "_id name",
			})
			.sort({ quantitySold: -1 });

		// Filter products with quantitySold > 0
		const filteredProducts = products.filter(
			(product) => product.quantitySold > 0
		);

		// Transform filtered products to required format
		const productData = filteredProducts.map((product) => ({
			productCategoryId: product.productCategory._id,
			// @ts-ignore
			productCategoryName: product.productCategory.name,
			// @ts-ignore
			categoryName: product.shop.category.name,
			// @ts-ignore
			categoryImage: product.shop.category.image,
			// @ts-ignore
			categoryIcon: product.shop.category.icon,
			quantitySold: product.quantitySold,
			totalIncome:
				product.productPrice * product.quantitySold,
		}));

		// Group products by productCategoryId
		const groupedData = groupBy(
			productData,
			"productCategoryId"
		);

		// Summarize quantitySold and totalIncome for each category
		const response = Object.keys(groupedData).map(
			(categoryId) => {
				const categoryProducts = groupedData[categoryId];

				const totalSoldQuantity = categoryProducts.reduce(
					(sum, product) => sum + product.quantitySold,
					0
				);
				const totalAmount = categoryProducts.reduce(
					(sum, product) => sum + product.totalIncome,
					0
				);

				// Return formatted response for each category
				return {
					productCategoryId: categoryId,
					productCategoryName:
						categoryProducts[0].productCategoryName,
					totalSoldQuantity,
					totalAmount,
					categoryName: categoryProducts[0].categoryName,
					categoryIcon: categoryProducts[0].categoryIcon,
					categoryImage: categoryProducts[0].categoryImage,
				};
			}
		);

		// Sort response by totalSoldQuantity in descending order
		response.sort(
			(a, b) => b.totalSoldQuantity - a.totalSoldQuantity
		);

		// Send response with grouped and sorted data
		return res.send(
			successResponse(
				"Top-selling product categories fetched successfully",
				response
			)
		);
	} catch (error) {
		next(error);
	}
};

export const shopValueMetricAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;
		const data = {
			grossMechaniseValue: 0,
			netMechaniseValue: 0,
			itemSold: 0,
			pageView: 0,
			averageOrderValue: 0,
			activeShops: 0,
			churnRate: 0,
			cartAbandonmentRate: 0,
		};

		// Run independent queries in parallel using Promise.all
		const [
			totalItemSoldResult,
			totalPageViewResult,
			totalActiveShops,
			totalCart,
			abandonCart,
			totalAmount,
			totalCancelledOrderValue,
			totalDiscount,
			totalReturnProduct,
			totalInactiveShop,
		] = await Promise.all([
			Product.aggregate([
				{
					$group: {
						_id: null,
						total: { $sum: "$quantitySold" },
					},
				},
			]),
			Product.aggregate([
				{
					$group: {
						_id: null,
						total: { $sum: { $size: "$views" } },
					},
				},
			]),
			Shop.countDocuments({ status: StatusTypes.ACTIVE }),
			CartItem.countDocuments(),
			CartItem.countDocuments({
				status: CartItemStatus.ACTIVE,
			}),
			OrderPaymentGroup.aggregate([
				{
					$group: {
						_id: null,
						total: { $sum: "$totalAmount" },
					},
				},
			]),
			OrderPaymentGroup.aggregate([
				{
					$match: { status: OrderStatus.CANCELLED },
				},
				{
					$group: {
						_id: null,
						total: { $sum: "$totalAmount" },
					},
				},
			]),
			OrderPaymentGroup.aggregate([
				{
					$group: {
						_id: null,
						total: { $sum: "$totalDiscount" },
					},
				},
			]),
			ReturnProductModel.aggregate([
				{
					$match: { status: "resolved" },
				},
				{
					$lookup: {
						from: "products",
						localField: "productId",
						foreignField: "_id",
						as: "productDetails",
					},
				},
				{
					$unwind: "$productDetails",
				},
				{
					$group: {
						_id: null,
						totalAmount: {
							$sum: "$productDetails.actualPrice",
						},
					},
				},
			]),
			Shop.countDocuments(),
		]);

		// Calculate the churn rate
		data.churnRate =
			(totalInactiveShop /
				(totalActiveShops + totalInactiveShop)) *
			100;

		// Set values in the data object
		data.itemSold = totalItemSoldResult[0]?.total || 0;
		data.pageView = totalPageViewResult[0]?.total || 0;
		data.activeShops = totalActiveShops;
		data.cartAbandonmentRate = Math.round(
			(abandonCart / totalCart) * 100
		);
		data.grossMechaniseValue = totalAmount[0]?.total || 0;
		data.averageOrderValue =
			data.grossMechaniseValue /
			(await Order.countDocuments());

		// Handle net merchandise value
		const cancelledOrderValue =
			totalCancelledOrderValue[0]?.total || 0;
		const discountValue = totalDiscount[0]?.total || 0;
		const returnProductValue =
			totalReturnProduct[0]?.totalAmount || 0;

		const totalSum =
			discountValue +
			returnProductValue +
			cancelledOrderValue;
		data.netMechaniseValue =
			data.grossMechaniseValue - totalSum;

		// Return the response
		return res.send(
			successResponse(
				"Shop value metrics fetched successfully",
				data
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getRecentOrdersAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;
		// Get orders
		const orders = await Order.find()
			.select(
				"_id user shop status price createdAt orderPaymentGroup discountTotal"
			)
			.populate({
				path: "shop",
				select: "brand_name",
			})
			.sort({ createdAt: -1 });

		// Format orders with async map
		const formattedOrders = await Promise.all(
			orders.map(async (order) => {
				const { firstName, lastName } =
					await userNotificationInfo(order.user);
				return {
					_id: order._id,
					date: order.createdAt,
					customerName: `${firstName} ${lastName}`,
					// @ts-ignore
					vendor: order.shop?.brand_name,
					// @ts-ignore
					orderValue: order.price,
					// @ts-ignore
					discount: order.discountTotal,
					status: order.status,
				};
			})
		);

		// Send response with formatted data
		return res.send(
			successResponse(
				"Recent orders fetched successfully",
				formattedOrders
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getAllShopsAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;
		// Fetch all shops with populated category data
		const shops = await Shop.find()
			.populate({
				path: "category",
				select: "name",
			})
			.sort({ createdAt: -1 });

		// Process shops and include user notification info
		const updatedShops = await Promise.all(
			shops.map(async (shop) => {
				const orderCount = await Order.countDocuments({
					shop: shop._id,
				});
				const productCount = await Product.countDocuments({
					shop: shop._id,
					status: {
						$in: [
							ProductStatus.VERIFIED,
							ProductStatus.OUT_OF_STOCK,
							ProductStatus.UNVERIFIED,
							,
						],
					},
				});
				return {
					_id: shop._id,
					date: shop.createdAt,
					brand_name: shop.brand_name,
					logo: shop.logoImageUrl,
					status: shop.status,
					// @ts-ignore
					category: shop.category.name,
					mobileNumber: shop.official_phone_number,
					orderQty: orderCount,
					productQty: productCount,
				};
			})
		);
		// Send response with formatted data
		return res.send(
			successResponse(
				"Shops fetched successfully",
				updatedShops
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleShopAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;
		const id = req.params.id;
		// Fetch shop with the specified ID
		const shop = await Shop.findOne({ _id: id })
			.populate({
				path: "category",
				select: "name",
			})
			.populate({
				path: "state",
				select: "name",
			});
		// Verifying is shop exist
		if (!shop) throw new NotFoundError("shop not found");
		//  Get shop details
		const shopDetails = {
			_id: shop._id,
			// @ts-ignore
			category: shop.category.name,
			status: shop.status,
			brand_name: shop.brand_name,
			logo: shop.logoImageUrl,
			shopDescription: shop.description,
			createdAt: shop.createdAt,
			tierLevel: shop.tierLevel,
			landMark: shop.landMark,
			address: shop.address,
			lga: shop.lga ?? null,
			// @ts-ignore
			state: shop.state.name,
		};
		// Get shop metrics
		const shopMetrics = {
			totalTransactions: 0,
			totalDeliveryFee: 0,
			totalDisbursement: 0,
			totalRevenue: 0,
			totalSoldProducts: 0,
			totalOrders: 0,
			totalPendingOrders: 0,
			totalRejectedOrders: 0,
			totalFollowers: 0,
			totalStaff: 0,
			totalPendingDisbursement: 0,
		};

		const orders = await Order.find({
			shop: shop._id,
			paymentStatus: OrderPaymentStatus.PAID,
		});
		for (const order of orders) {
			shopMetrics.totalTransactions += order.price;
		}
		const orderIds = orders.map((order) => order._id);
		const paymentGroups = await OrderPaymentGroup.find({
			orders: { $in: orderIds },
		});

		for (const paymentGroup of paymentGroups) {
			shopMetrics.totalDeliveryFee +=
				paymentGroup.totalDeliveryFee;
		}

		const products = await Product.find({ shop: shop._id });
		for (const product of products) {
			shopMetrics.totalSoldProducts += product.quantitySold;
		}
		shopMetrics.totalOrders = await Order.countDocuments();
		shopMetrics.totalPendingOrders =
			await Order.countDocuments({
				status: OrderStatus.PENDING,
			});
		shopMetrics.totalRejectedOrders =
			await Order.countDocuments({
				status: OrderStatus.REJECTED,
			});
		shopMetrics.totalFollowers = shop.followers.length;
		shopMetrics.totalRevenue = shop.revenue;
		shopMetrics.totalPendingDisbursement =
			shop.unSettledRevenue;
		shopMetrics.totalDisbursement = shop.settledRevenue;
		const shopStaff = await ShopMember.find({
			shopId: shop._id,
			status: "staff",
		}).populate({
			path: "permissions",
			select: "permissionCode",
		});
		shopMetrics.totalStaff = shopStaff.length;

		const formattedStaff = await Promise.all(
			shopStaff.map(async (staff) => {
				const user = await userNotificationInfo(
					staff.userId
				);
				return {
					_id: staff._id,
					avatar: null,
					staffName: `${user.firstName} ${user.lastName}`,
					dateAdded: staff.createdAt,
					permission: staff.permissions.map(
						// @ts-ignore
						(permission) => permission.permissionCode
					),
					status: staff.status,
				};
			})
		);

		const data = {
			shopDetails,
			shopMetrics,
			shopStaff: formattedStaff,
		};
		// Send response with formatted data
		return res.send(
			successResponse("Shop fetched successfully", data)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopProductsAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;
		// Get shop is
		const id = req.params.id;
		// Fetch products with the specified shop ID
		const products = await Product.find({ shop: id });
		return res.send(
			successResponse(
				"Shop products fetched successfully",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopMostRecentOrdersAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;
		// Get shop ID
		const shopId = req.params.id;
		// Get recent orders for the specified shop
		const orders = await Order.find({
			shop: shopId,
		})
			.populate({
				path: "cartItem",
				select: "selectColorImage quantity",
				populate: {
					path: "product",
					select: "productName productDescription",
				},
			})
			.populate({
				path: "shop",
				select: "brand_name",
			})
			.sort({ createdAt: -1 });

		// Use await with Promise.all to wait for all async operations
		const updatedOrders = await Promise.all(
			orders.map(async (order) => {
				const img =
					// @ts-ignore
					order.cartItem?.selectColorImage.images[0] ??
					null;
				const prodName =
					// @ts-ignore
					order.cartItem?.product.productName ?? null;
				return {
					_id: order._id,
					image: img,
					// @ts-ignore
					productNam: prodName,
					// @ts-ignore
					qty: order.cartItem?.quantity ?? null,
					price: order.price,
					// @ts-ignore
					vendor: order.shop.brand_name,
				};
			})
		);

		return res.send(
			successResponse(
				"Shop recent orders fetched successfully",
				updatedOrders
			)
		);
	} catch (error) {
		next(error);
	}
};

export const allOrdersAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;
		const orders = await Order.find({})
			.populate({
				path: "cartItem",
				select: "selectColorImage quantity",
				populate: {
					path: "product",
					select: "productName productDescription",
				},
			})
			.populate({
				path: "shop",
				select: "brand_name logoImageUrl",
			})
			.sort({ createdAt: -1 });

		// Use await with Promise.all to wait for all async operations
		const updatedOrders = await Promise.all(
			orders.map(async (order) => {
				const user = await userNotificationInfo(order.user);
				// @ts-ignore

				return {
					_id: order._id,
					date: order.createdAt,
					customerName: `${user.firstName} ${user.lastName}`,
					email: `${user.email}`,
					// @ts-ignore
					vendor: order.shop.brand_name,
					price: order.price,
					// @ts-ignore
					qty: order.cartItem?.quantity ?? null,
					status: order.status,
				};
			})
		);

		return res.send(
			successResponse(
				"Orders fetched successfully",
				updatedOrders
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleOrderAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;
		const id = req.params.id;

		const order = await Order.findOne({ _id: id })
			.populate({
				path: "cartItem",
				select: "selectColorImage quantity",
				populate: {
					path: "product",
					select: "productName productDescription",
				},
			})
			.populate({
				path: "shop",
				select: "brand_name logoImageUrl",
			})
			.populate({
				path: "orderPaymentGroup",
				select: "totalAmount",
			})
			.sort({ createdAt: -1 });

		const paymentGroup = await OrderPaymentGroup.findOne({
			orders: { $in: [id] },
		}).populate({
			path: "deliveryMerchant",
			select: "_id name",
		});

		const cart = await CartItem.findOne({
			_id: order?.cartItem._id,
		});

		// Check if order exists before processing
		if (!order) throw new NotFoundError("Order not found");
		if (!paymentGroup)
			throw new NotFoundError("payment group not found");

		if (!cart)
			throw new NotFoundError("cart item not found");
		const user = await userNotificationInfo(order.user);
		const formattedOrder = {
			status: order.status,
			_id: order._id,
			date: order.createdAt,
			totalAmount: paymentGroup.totalAmount,
			deliveryFee: paymentGroup.totalDeliveryFee,

			productImage:
				// @ts-ignore
				order?.cartItem.selectColorImage.images[0] ?? null,

			productName:
				// @ts-ignore
				order?.cartItem.product.productName ?? null,
			// @ts-ignore
			quantity: order?.cartItem.quantity ?? null,
			// @ts-ignore
			productPrice: cart.amount,
			// @ts-ignore
			vendor: order.shop.brand_name,
			paymentMethod: paymentGroup.paymentType,
			paymentStatus: paymentGroup.paymentStatus,
			transactionRef: paymentGroup.transactionReference,
			deliveryAddress: order.deliveryAddress,
			shippingFee: paymentGroup.totalDeliveryFee,
			// @ts-ignore
			deliveryMerchant: paymentGroup.deliveryMerchant.name,
			customerName: order.receiversName,
			customerEmail: `${user.email}`,
			customerPhoneNumber: order.receiversPhoneNumber,
		};

		return res.send(
			successResponse(
				"Order fetched successfully",
				formattedOrder
			)
		);
	} catch (error) {
		next(error);
	}
};

export const createShopFAQGroup = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		// req.user;
		const { name } =
			req.body as CreateFaqGroupInput["body"];
		// Validate faq group name does not exist
		const existingGroup =
			await AdminShopFAQGroupModel.findOne({
				name: name,
			});
		if (existingGroup)
			throw new NotFoundError("Group already exist");
		const newFaqGroup = new AdminShopFAQGroupModel({
			name,
		});
		await newFaqGroup.save();
		return res.send(
			successResponse(
				"FAQ group created successfully",
				newFaqGroup
			)
		);
	} catch (error) {
		next(error);
	}
};

export const createShopFAQAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const { faqs } = req.body as CreateFaqInput["body"];

		// Validate that the FAQ group exists
		const existingGroup =
			await AdminShopFAQGroupModel.findById(id);
		if (!existingGroup) {
			throw new NotFoundError("FAQ group doesn't exist");
		}

		// Validate FAQs
		if (
			!faqs ||
			!Array.isArray(faqs) ||
			faqs.length === 0
		) {
			throw new NotFoundError(
				"FAQs must be a non-empty array of objects containing 'question' and 'answer"
			);
		}

		// Filter out existing questions
		const existingQuestions = await AdminShopFAQModel.find({
			faqGroupId: id,
			question: { $in: faqs.map((faq) => faq.question) },
		}).select("question");

		const existingQuestionSet = new Set(
			existingQuestions.map((faq) => faq.question)
		);

		const newFAQsData = faqs.filter(
			(faq) => !existingQuestionSet.has(faq.question)
		);

		// Insert only new FAQs
		if (newFAQsData.length > 0) {
			const newFAQs = await AdminShopFAQModel.insertMany(
				newFAQsData.map((faq) => ({
					faqGroupId: id,
					question: faq.question,
					answer: faq.answer,
				}))
			);

			// Update the group with the new FAQ IDs
			existingGroup.faqs.push(
				...newFAQs.map((faq) => faq._id)
			);
			await existingGroup.save();

			return res.send(
				successResponse(
					`${newFAQs.length} FAQs created successfully`,
					newFAQs
				)
			);
		}

		return res.send(
			successResponse(
				"No new FAQs to add, all questions already exist",
				[]
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopTransactionsAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;

		const id = req.params.id;

		const transactions =
			await OrderPaymentGroup.find().populate({
				path: "orders",
				populate: {
					path: "shop",
				},
			});

		// Filter and map the transactions to get the necessary details
		const updateTransactions = await Promise.all(
			transactions
				.filter((transaction) => {
					// Compare the shopId with the transaction's shop _id
					return transaction.orders.some(
						// @ts-ignore
						(order) => String(order.shop._id) === id
					);
				})
				.map(async (transaction) => {
					const user = await userNotificationInfo(
						transaction.user
					);
					const fullName = `${user.firstName} ${user.lastName}`;
					return {
						_id: transaction._id,
						date: transaction.createdAt,
						ref: transaction.transactionReference,
						userName: fullName,
						mobile: user.mobileNumber,
						// @ts-ignore
						shopId: transaction.orders[0].shop._id,
						// @ts-ignore
						shopName: transaction.orders[0].shop.brand_name,
						shopLogo:
							// @ts-ignore
							transaction.orders[0].shop.logoImageUrl,
						amount: transaction.totalAmount,
						subTotal: transaction.subTotal,
						paymentMethod: transaction.paymentType,
						status: transaction.paymentStatus,
					};
				})
		);

		return res.send(
			successResponse(
				"Shop transactions fetched successfully",
				updateTransactions
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopTransactionChartAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;

		const id = req.params.id;
		const { year, month } = req.query; // Expecting year and month from query params

		// Fetch transactions and populate necessary fields
		const transactions =
			await OrderPaymentGroup.find().populate({
				path: "orders",
				populate: {
					path: "shop",
				},
			});

		// Filter transactions for the given shop ID
		const filteredTransactions = transactions.filter(
			(transaction) =>
				transaction.orders.some(
					// @ts-ignore
					(order) => String(order.shop._id) === id
				)
		);

		// Create a map to store total amounts by date
		const transactionTotals: Record<string, number> = {};

		// Process transactions
		for (const transaction of filteredTransactions) {
			const transactionDate = new Date(
				transaction.createdAt
			);

			// Use provided year and month if available, else use transaction's year and month
			const transactionYear = year
				? Number(year)
				: transactionDate.getFullYear();
			const transactionMonth = month
				? Number(month) - 1
				: transactionDate.getMonth();

			// Skip transactions outside the desired year and month
			if (
				transactionDate.getFullYear() !== transactionYear ||
				transactionDate.getMonth() !== transactionMonth
			) {
				continue;
			}

			// Format date as `DD-MMM-YYYY` (e.g., `1-Aug-2024`)
			const formattedDate = `${transactionDate.getDate()}-${transactionDate.toLocaleString(
				"default",
				{ month: "short" }
			)}-${transactionDate.getFullYear()}`;

			// Sum up the transaction amounts by date
			transactionTotals[formattedDate] =
				(transactionTotals[formattedDate] || 0) +
				transaction.totalAmount;
		}

		// Handle missing dates by populating with 0
		const daysInMonth = new Date(
			Number(year || new Date().getFullYear()),
			Number(month || new Date().getMonth() + 1),
			0
		).getDate();

		const response = {};
		for (let day = 1; day <= daysInMonth; day++) {
			const formattedDate = `${day}-${new Date(
				0,
				month ? Number(month) - 1 : new Date().getMonth()
			).toLocaleString("default", { month: "short" })}-${
				year || new Date().getFullYear()
			}`;

			response[formattedDate] =
				transactionTotals[formattedDate] || 0;
		}

		return res.send(
			successResponse(
				"Shop transactions fetched successfully",
				response
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleShopOrderActivitiesOverview = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authorization & Authentication
		req.user;

		// Parse and validate year and month from query parameters
		let year = parseInt(req.query.year as string, 10);
		let month = parseInt(req.query.month as string, 10);

		// Default to the current year and month if invalid or not provided
		const currentDate = new Date();
		if (!year || isNaN(year)) {
			year = currentDate.getFullYear();
		}
		if (!month || isNaN(month) || month < 1 || month > 12) {
			month = currentDate.getMonth() + 1;
		}

		// Calculate the start and end dates for the specified month
		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 1); // First day of the next month

		// Determine the number of days in the specified month
		const daysInMonth = new Date(year, month, 0).getDate();

		// Fetch all orders for the given shop within the specified month
		const orders = await Order.find({
			shop: req.params.id,
			createdAt: {
				$gte: startDate,
				$lt: endDate,
			},
		});

		// Initialize an array to count orders per day
		const dailyOrderCount = Array(daysInMonth).fill(0);

		// Populate daily order counts
		orders.forEach((order) => {
			const day = new Date(order.createdAt).getDate(); // Extract day of the month
			dailyOrderCount[day - 1] += 1; // Increment count for that day
		});

		// Prepare the response structure
		const dailyOrderSummary = dailyOrderCount.map(
			(count, index) => ({
				day: index + 1, // Day of the month
				orderCount: count, // Number of orders for that day
			})
		);

		// Send the success response
		return res.send(
			successResponse(
				"Orders activities overview fetched successfully",
				dailyOrderSummary
			)
		);
	} catch (error) {
		// Pass the error to the next middleware
		next(error);
	}
};
