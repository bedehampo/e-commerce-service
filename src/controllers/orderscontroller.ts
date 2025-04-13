import { NextFunction, Response } from "express";
import { successResponse } from "../helpers";
import { differenceInYears } from "date-fns";
import _ from "lodash";
import cron from "node-cron";
import {
	AdminRequest,
	CustomRequest,
	StatusTypes,
} from "../utils/interfaces";
import mongoose from "mongoose";
import {
	AuthorizationError,
	NotFoundError,
	ValidationError,
} from "../errors";
import { OrderGroup } from "../model/shop/OrderGroup";
import { Order } from "../model/shop/order";
import { Shop } from "../model/shop/shop";
import {
	AcceptOrRejectOrderInput,
	CalculateDeliveryInput,
	CompleteOrderInput,
	GetOrdersByUserInput,
	InitiateOrderInput,
	getOrdersByShopPayload,
} from "../validation/order.schema";

import { DeliveryMerchant } from "../model/shop/deliveryMerchant";
import {
	CalculateDeliveryService,
	acceptRejectOrderService,
	getShopOrdersService,
	getSingleOrderService,
	getUserOrdersService,
	initiateOrderService,
	rejectOrderService,
	trackOrderService,
	viewRecentlyPurchasedItemService,
} from "../services";
import completeOrderService from "../services/shop/completeOrderService";
import {
	checkAdminUser,
	checkUserById,
} from "../middlewares/validators";
import {
	IOrderGroup,
	OrderDeliveryStatus,
	OrderPaymentType,
	OrderStatus,
} from "../types/order";
import {
	getCustomerSegmentData,
	getOrderCountdown,
	getStatsYear,
	notificationService,
	userNotificationInfo,
} from "../utils/global";
import { checkShopPermission } from "../middlewares/checkShopPermission";
import { ShopAction } from "../model/shop/shopActions";
import { AdminService } from "../lib/adminService";
import {
	getUserIdAndUser,
	saveShopAction,
} from "../services/product/productServices";
import { Product } from "../model/shop/product";
import { ProductStatus } from "../types/shop";
import { State } from "../model/shop/state";
import { CartItem } from "../model/shop/cartItem";
import { UserDeliveryAddress } from "../model/shop/userDeliveryAddress";
import { RejectedOrderReason } from "../model/shop/rejectedOrdersReason";
import { checkPermission } from "../middlewares/checkPermission";

export const rejectOrderReasons = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Get User Id
		const { userId } = await getUserIdAndUser(req);

		// Check if user is a vendor
		const shop = await Shop.findOne({
			user: userId,
		});
		if (!shop) throw new NotFoundError("shop not found");

		const reasons = await RejectedOrderReason.find().select(
			"_id name"
		);
		return res.send(
			successResponse(
				"Order rejection reasons fetched successfully",
				reasons
			)
		);
	} catch (error) {
		next(error);
	}
};

export const rejectOrderReason = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Get User Id
		const { userId } = await getUserIdAndUser(req);

		const id = req.params.id;

		// Check if user is a vendor
		const shop = await Shop.findOne({
			user: userId,
		});
		if (!shop) throw new NotFoundError("shop not found");

		const reason = await RejectedOrderReason.findOne({
			_id: id,
		}).select("_id name");
		return res.send(
			successResponse(
				"Order rejection reason fetched successfully",
				reason
			)
		);
	} catch (error) {
		next(error);
	}
};

// testing git issues - to uncomment later

export const initiateOrder = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		const data = req.body;
		const { deliveryMerchant, paymentType } =
			data as InitiateOrderInput["body"];
		const userId = req.user && req.user.id;

		const result = await initiateOrderService(
			data,
			userId,
			session,
			req.userService,
			req.transactionService
		);

		return res.send(
			successResponse(
				`Order ${
					paymentType === OrderPaymentType.PAYONDELIVERY
						? "completed"
						: "intitiated"
				} successfully`,
				result
			)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

export const completeOrder = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		const data = req.body;
		const userId = req.user && req.user.id;
		const userService = req.userService;
		const user = await checkUserById(userId, userService);
		const { order_payment_group, pin } =
			data as CompleteOrderInput["body"];

		//update payment as paid
		session.startTransaction();
		const result = await completeOrderService(
			order_payment_group,
			userId,
			pin,
			session,
			req.userService,
			req.transactionService
		);

		const userOrderMessage = `Thank you for your purchase! Your payment has been successfully processed\n\nWe are now preparing your items for shipment and will notify you once they are on the way.\n\nIf you have any questions or need further assistance, please do not hesitate to contact our customer support team\n\nThank you for shopping with us!\nBest regards,\nMotoPay E-commerce`;
		// Send notification to user
		await notificationService(
			"MotoPay",
			user,
			"Order payment confirmation",
			userOrderMessage
		);

		// Send notification to the vendor
		const vendor = result.shopDeliveryDetails;
		for (const vendorDetail of vendor) {
			try {
				const shop = await Shop.findById(vendorDetail.shop);
				if (!shop) {
					console.log(
						`Shop with id ${vendorDetail.shop} not found`
					);
					continue;
				}

				const shopOwner = await userNotificationInfo(
					shop.user
				);
				if (!shopOwner) {
					console.log(
						`User with id ${shop.user} not found`
					);
					continue;
				}
				const venderOrderMessage = `You have received a new order!\n\nPlease proceed to your order dashboard to take necessary action as soon as possible.\nThank you for your prompt attention to this order.\n\nBest regards,\nMotoPay E-commerce`;

				await notificationService(
					"MotoPay",
					shopOwner,
					"New order received",
					venderOrderMessage
				);
			} catch (error) {
				console.error(
					`Error processing vendor detail: ${error.message}`
				);
			}
		}

		return res.send(
			successResponse(
				"Order completed successfully",
				result
			)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

interface IDeliveryAddress {
	latitude: number;
	longitude: number;
}
interface ICalculateDelivery {
	deliveryAddress: IDeliveryAddress;
	deliveryAddressDescription: string;
	receiversName: string;
	receiversPhoneNumber: string;
	cartItemIds: string[];
}

export const calculateDeliveryPrice = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	console.log("Hello Hampo");
	const session = await mongoose.startSession();
	try {
		const userId = req.user && req.user.id;
		const { userDeliveryAddressId, cartItemIds } =
			req.body as CalculateDeliveryInput["body"];
		session.startTransaction();

		const result = await CalculateDeliveryService(
			req.body,
			userId,
			session,
			req.userService
		);
		return res.send(
			successResponse(
				"Delivery prices retrieved successfully",
				result
			)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

export const acceptOrRejectOrder = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const { userId } = await getUserIdAndUser(req);

	const { shopId, orderId } = req.params;
	const {
		status,
		reasonForRejectionId,
		userRejectionMessage,
	} = req.body as AcceptOrRejectOrderInput["body"];

	// const { user } = await Order.findById(orderId);
	// const userService = req.userService;
	// const theUser = await checkUserById(user, userService);

	// if (!order) throw new NotFoundError("order not found");
	// const shop = await Shop.findById({
	//   _id: order.shop,
	//   status: StatusTypes.ACTIVE,
	// });
	// if (!shop) throw new NotFoundError("active shop not found");
	// await checkShopPermission(userId, order.shop.toString(), "reject_orders");

	const session = await mongoose.startSession();
	try {
		// verify upload product permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"accept-reject-orders"
		);

		session.startTransaction();
		const extractShop = await Shop.findById(shopId);
		const extractUserId = extractShop.user;

		const response = await acceptRejectOrderService(
			orderId,
			extractUserId,
			status,
			session,
			req.userService,
			reasonForRejectionId,
			userRejectionMessage
		);

		const shopAction = new ShopAction({
			user: userId,
			action:
				status == "accepted"
					? "accepted an order."
					: "rejected an order.",
			shop: shopId,
		});
		await shopAction.save();
		// send notification

		return res.send(
			successResponse(
				`Order ${status} successfully`,
				response
			)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

export const getOrdersByUser = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const userId = req.user && req.user.id;
	const { status } = req.query;

	try {
		const { status } =
			req.query as GetOrdersByUserInput["query"];

		const orders = await getUserOrdersService(userId, {
			status,
		});

		return res.send(
			successResponse("Orders fetched successfully", orders)
		);
	} catch (error) {
		next(error);
	}
};

export const newGetOrderByUser = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Validate user
		const { userId } = await getUserIdAndUser(req);

		// Validate shop

		// Build query
		const status = req.query.status;
		const orderQuery: any = { user: userId };
		if (status) {
			orderQuery.status = status;
		}

		// Retrieved orders
		const orders = await OrderGroup.find(orderQuery)
			.select(
				"_id createdAt status totalAmount orders displayId"
			)
			.populate({
				path: "orders",
				select: "cartItem",
				populate: {
					path: "cartItem price",
					select:
						"selectColorImage.images quantity selected_variations",
					populate: {
						path: "product",
						select: "productName productDescription",
					},
				},
			});

		// Transform orders into desired format
		const formattedOrders = orders.map((order) => {
			let totalQuantity = 0;
			const formattedOrderItems = order.orders.map(
				(orderItem) => {
					//@ts-ignore
					const cartItem = orderItem.cartItem;
					totalQuantity += cartItem.quantity;

					return {
						//@ts-ignore
						_id: orderItem._id,
						productName: cartItem.product.productName,
						productDescription:
							cartItem.product.productDescription,
						image: cartItem.selectColorImage.images[0],
						variation: cartItem.selected_variations,
						// @ts-ignore
						price: orderItem.price,
						quantity: cartItem.quantity,
					};
				}
			);

			return {
				_id: order._id,
				displayId: order.displayId,
				orders: formattedOrderItems,
				totalAmount: order.totalAmount,
				totalQuantity: totalQuantity,
				status: order.status,
				createdAt: order.createdAt,
			};
		});

		return res.send(
			successResponse(
				"Orders fetched successfully",
				formattedOrders
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getOrdersByShop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const userId = req.user && req.user.id;
	const userService = req.userService;
	const status = req.query.status;

	try {
		// Extracting the shop details
		const shop = await Shop.findOne({
			user: userId,
		});

		const orderQuery: any = { shop: shop._id };
		if (status) {
			orderQuery.status = status;
		}

		const orders = await getShopOrdersService(
			userId,
			orderQuery,
			userService
		);

		// checking if the shop exist
		// if (!shop) throw new NotFoundError("Shop not found");
		// Build query
		// Build the query object based on the optional status filter
		// Get the shop orders
		// const orders = await Order.find(orderQuery)
		// 	.select("_id createdAt updatedAt price status shop")
		// 	.populate({
		// 		path: "cartItem",
		// 		select: "quantity selectColorImage",
		// 		populate: {
		// 			path: "product",
		// 			select: "productName productDescription",
		// 		},
		// 	});

		// Add timer to each order
		// const ordersWithTimer = await Promise.all(
		// 	orders.map(async (order) => {
		// 		const orderObject = order.toObject
		// 			? order.toObject()
		// 			: order;
		// 		const timer = await getOrderCountdown(order._id);
		// 		return {
		// 			...orderObject,
		// 			timer,
		// 		};
		// 	})
		// );

		return res.send(
			successResponse("Orders fetched successfully", orders)
		);
	} catch (error) {
		next(error);
	}
};

export const newGetOrderByShop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Validate user
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.shopId;

		await checkShopPermission(
			userId,
			shopId.toString(),
			"accept-reject-orders"
		);

		// Validate shop
		const shop = await Shop.findOne({ _id: shopId });
		if (!shop) throw new NotFoundError("Shop not found");

		// Build query
		const status = req.query.status;
		const orderQuery: any = { shop: shop._id };
		if (status) {
			orderQuery.status = status;
		}

		// Retrieved orders
		const orders = await OrderGroup.find(orderQuery)
			.select(
				"_id createdAt status totalAmount orders displayId shop"
			)
			.populate({
				path: "orders",
				select: "cartItem price",
				populate: {
					path: "cartItem",
					select:
						"selectColorImage.images quantity selected_variations",
					populate: {
						path: "product",
						select: "productName",
					},
				},
			});

		// Transform orders into desired format
		const formattedOrders = orders.map((order) => {
			let totalQuantity = 0;
			const formattedOrderItems = order.orders.map(
				(orderItem) => {
					//@ts-ignore
					const cartItem = orderItem.cartItem;
					totalQuantity += cartItem.quantity;

					return {
						//@ts-ignore
						_id: orderItem._id,
						productName: cartItem.product.productName,
						image: cartItem.selectColorImage.images[0],
						variations: cartItem.selected_variations,
						// @ts-ignore
						price: orderItem.price,
						quantity: cartItem.quantity,
					};
				}
			);

			return {
				_id: order._id,
				displayId: order.displayId,
				orders: formattedOrderItems,
				totalAmount: order.totalAmount,
				totalQuantity: totalQuantity,
				status: order.status,
				shop: order.shop,
				createdAt: order.createdAt,
			};
		});

		saveShopAction(
			userId,
			"viewed an order.",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"Orders fetched successfully",
				formattedOrders
			)
		);
	} catch (error) {
		next(error);
	}
};

export const newGetSingleOrderByShop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Validate user
		const { userId } = await getUserIdAndUser(req);
		const orderId = req.params.orderId;
		const shopId = req.params.shopId;

		await checkShopPermission(
			userId,
			shopId.toString(),
			"accept-reject-orders"
		);

		// Validate shop
		const shop = await Shop.findOne({ _id: shopId });
		if (!shop) throw new NotFoundError("Shop not found");

		// Build query
		const status = req.query.status;
		const orderQuery: any = {
			_id: orderId,
			shop: shop._id,
		};
		if (status) {
			orderQuery.status = status;
		}

		// Retrieve order
		const order = await OrderGroup.findOne(orderQuery)
			.select(
				"_id createdAt status totalAmount orders displayId shop"
			)
			.populate({
				path: "orders",
				select: "cartItem createdAt price",
				populate: {
					path: "cartItem",
					select:
						"selectColorImage.images quantity selected_variations",
					populate: {
						path: "product",
						select: "productName",
					},
				},
			});

		if (!order) {
			throw new NotFoundError("Order not found");
		}

		// Transform order into desired format
		let totalQuantity = 0;
		const formattedOrderItems = order.orders.map(
			(orderItem) => {
				//@ts-ignore
				const cartItem = orderItem.cartItem;
				totalQuantity += cartItem.quantity;

				return {
					//@ts-ignore
					_id: orderItem._id,
					productName: cartItem.product.productName,
					image: cartItem.selectColorImage.images[0],
					quantity: cartItem.quantity,
					// @ts-ignore
					createdAt: orderItem.createdAt,
					// @ts-ignore
					price: orderItem.price,
					// @ts-ignore
					variations: cartItem.selected_variations,
				};
			}
		);

		const formattedOrder = {
			_id: order._id,
			displayId: order.displayId,
			orders: formattedOrderItems,
			totalAmount: order.totalAmount,
			totalQuantity: totalQuantity,
			status: order.status,
			createdAt: order.createdAt,
			shop: order.shop,
		};

		saveShopAction(
			userId,
			"viewed an order.",
			shopId.toString()
		);

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

export const newGetSingleOrderByUser = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Validate user
		const { userId } = await getUserIdAndUser(req);
		const orderId = req.params.orderId;

		// Build query
		const status = req.query.status;
		const orderQuery: any = {
			_id: orderId,
			user: userId,
		};
		if (status) {
			orderQuery.status = status;
		}

		// Retrieve order
		const order = await OrderGroup.findOne(orderQuery)
			.select(
				"_id createdAt status totalAmount orders totalDeliveryFee deliveryMerchant receiversName deliveryAddressDescription paymentType displayId"
			)
			.populate({
				path: "orders",
				select: "cartItem createdAt price",
				populate: [
					{
						path: "cartItem",
						select:
							"selectColorImage.images quantity selected_variations",
						populate: {
							path: "product",
							select: "productName",
						},
					},
				],
			})
			.populate({
				path: "deliveryMerchant",
				select: "name",
			});

		if (!order) {
			throw new NotFoundError("Order not found");
		}

		// Transform order into desired format
		let totalQuantity = 0;
		const formattedOrderItems = order.orders.map(
			(orderItem) => {
				//@ts-ignore
				const cartItem = orderItem.cartItem;
				totalQuantity += cartItem.quantity;

				return {
					//@ts-ignore
					_id: orderItem._id,
					productName: cartItem.product.productName,
					image: cartItem.selectColorImage.images[0],
					quantity: cartItem.quantity,
					// @ts-ignore
					createdAt: orderItem.createdAt,
					// @ts-ignore
					price: orderItem.price,
					// @ts-ignore
					variations: cartItem.selected_variations,
				};
			}
		);

		const formattedOrder = {
			_id: order._id,
			displayId: order.displayId,
			orders: formattedOrderItems,
			totalAmount: order.totalAmount,
			totalQuantity: totalQuantity,
			status: order.status,
			createdAt: order.createdAt,

			paymentType: order.paymentType || null,
			totalDeliveryFee: order.totalDeliveryFee,
			// @ts-ignore
			deliveryMerchant: order.deliveryMerchant.name,
			receiversName: order.receiversName,
			receiverAddress: order.deliveryAddressDescription,
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

export const getSingleOrderByUser = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const userId = req.user && req.user.id;
	

	const orderId = req.params.orderId;

	try {
		const result = await getSingleOrderService(
			orderId,
			userId
		);
		return res.send(
			successResponse("Orders fetched successfully", result)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleOrderByShop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const userId = req.user && req.user.id;
	const orderId = req.params.id;

	try {
		const shop = await Shop.findOne({ user: userId });

		if (!shop) {
			throw new NotFoundError("Shop not found");
		}

		const shopId = shop._id;

		console.log(shopId);

		const order = await Order.findById(orderId).populate(
			"cartItem"
		);

		// Get order timer
		// const timer = await getOrderCountdown(orderId);

		// if (order.shop.toString() === shopId.toString()) {
		// 	throw new AuthorizationError(
		// 		"You are not allowed to view this order"
		// 	);
		// }

		// Attach the timer to the order object
		// const orderWithTimer = {
		// 	...order.toObject(),
		// 	timer,
		// };

		return res.send(
			successResponse("Orders fetched successfully", order)
		);
	} catch (error) {
		next(error);
	}
};

export const getOrderGroupsByUser = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const userId = req.user && req.user.id;
	try {
		const orderGroups = await OrderGroup.find({
			user: userId,
		});
		return res.send(
			successResponse(
				"Order groups fetched successfully",
				orderGroups
			)
		);
	} catch (error) {
		next(error);
	}
};

export const orderAcceptanceCountDown = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const orders = await Order.find();
	} catch (error) {
		throw error;
	}
};

export const getDeliveryMerchants = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const deliveryMerchants = await DeliveryMerchant.find(
			{}
		);
		return res.send(
			successResponse(
				"Delivery merchants fetched successfully",
				{
					deliveryMerchants,
				}
			)
		);
	} catch (error) {
		next(error);
	}
};

export const markOrderDelivered = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const userId = req.user && req.user.id;

	const orderId = req.params.orderId;

	try {
		const order = await Order.findById(orderId);

		// Check if the order belongs to the user
		if (order.user.toString() !== userId.toString()) {
			throw new AuthorizationError(
				"You are not allowed to view this order"
			);
		}

		if (!order) {
			throw new NotFoundError("Order not found");
		}

		if (order.status !== OrderStatus.ACCEPTED) {
			throw new NotFoundError(
				"Order must be in 'accepted' status to mark it as delivered"
			);
		}

		// Update the order status to "delivered"
		order.status = OrderStatus.DELIVERED;
		order.deliveryStatus = OrderDeliveryStatus.DELIVERED;
		order.customerStatus = "received"; // You can update the delivery status as well

		await order.save();

		// TO DO: Send push notification to the user that the order has been delivered
		return res.send(
			successResponse(
				"Order marked as delivered successfully",
				null
			)
		);
	} catch (err) {
		console.error("Error marking order as delivered:", err);
		next(err);
	}
};

// Admin endpoints
// export const getOrdersAdmin = async (
// 	req: AdminRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		const adminService = req.AdminService;
// 		await checkAdminUser(adminId, adminService);
// 		const searchParam = req.query.search;
// 		const orders = await Order.find()
// 			.populate(
// 				"shop",
// 				"brand_name shopLogoUrl official_email createdAt"
// 			)
// 			.select("shop price");

// 		let shopOrders = await Shop.aggregate([
// 			{
// 				$lookup: {
// 					from: "orders",
// 					localField: "_id",
// 					foreignField: "shop",
// 					as: "orders",
// 				},
// 			},
// 			{
// 				$project: {
// 					createdAt: 1,
// 					shopLogoUrl: 1,
// 					brand_name: 1,
// 					official_email: 1,
// 					aov: { $avg: "$orders.price" },
// 					target: null,
// 					variance: null,
// 					totalOrders: { $size: "$orders" },
// 					totalRevenue: { $sum: "$orders.price" },
// 				},
// 			},
// 		]);

// 		if (searchParam) {
// 			shopOrders = shopOrders.filter((order) =>
// 				JSON.stringify(order)
// 					.toLowerCase()
// 					.includes(searchParam.toString().toLowerCase())
// 			);
// 		}

// 		const totalOrder = orders.length;
// 		const totalOrderValue = orders.reduce(
// 			(total, order) => total + order.price,
// 			0
// 		);

// 		return res.send(
// 			successResponse("Orders retrieved", {
// 				totalOrder,
// 				totalOrderValue,
// 				shopOrders,
// 			})
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const getOrderStatsAdmin = async (
// 	req: AdminRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		const adminService = req.AdminService;
// 		await checkAdminUser(adminId, adminService);
// 		const year = parseInt(req.params.year, 10);
// 		const monthlyStats = [];
// 		for (let month = 0; month < 12; month++) {
// 			const startDate = new Date(year, month, 1);
// 			const endDate = new Date(year, month + 1, 0);
// 			const ordersCount = await Order.countDocuments({
// 				createdAt: {
// 					$gte: startDate,
// 					$lte: endDate,
// 				},
// 			});
// 			monthlyStats.push({
// 				month: getStatsYear[month + 1],
// 				year,
// 				orderCount: ordersCount,
// 			});
// 		}
// 		return res.send(
// 			successResponse("Order statistics", monthlyStats)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

export const trackOrder = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const orderId = req.params.orderId;

	try {
		const result = await trackOrderService(orderId);
		return res.send(
			successResponse("Orders fetched successfully", result)
		);
	} catch (error) {
		next(error);
	}
};

export const viewRecentlyPurchasedItem = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const userId = req.user && req.user.id;
	try {
		const result = await viewRecentlyPurchasedItemService(
			userId
		);

		return res.send(
			successResponse(
				"Recently purchased items  successfully",
				result
			)
		);
	} catch (error) {
		next(error);
	}
};

interface CustomerData {
	CustomerID: string;
	InvoiceNo: string;
	InvoiceDate: Date;
	Quantity: number;
	UnitPrice: number;
}

export const getShopCustomerSegmentation = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.shopId;

		// Check shop permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"analysis"
		);
		// analysis;

		const customerData: CustomerData[] = [];
		const startDate = req.query.startDate as
			| string
			| undefined;
		const endDate = req.query.endDate as string | undefined;
		let fromDate: Date | undefined;
		let toDate: Date | undefined;

		if (startDate) {
			fromDate = new Date(startDate);
		}
		if (endDate) {
			toDate = new Date(endDate);
			toDate.setHours(23, 59, 59, 999);
		}

		const shop = await Shop.findOne({
			_id: shopId,
			status: StatusTypes.ACTIVE,
		});
		if (!shop)
			throw new NotFoundError("No active shop found");

		const orderQuery: any = {
			shop: shop._id,
		};
		if (fromDate && toDate) {
			orderQuery.createdAt = {
				$gte: fromDate,
				$lte: toDate,
			};
		} else if (fromDate) {
			orderQuery.createdAt = { $gte: fromDate };
		} else if (toDate) {
			orderQuery.createdAt = { $lte: toDate };
		}

		const orders = await Order.find(orderQuery);

		await Promise.all(
			orders.map(async (order) => {
				const cart = await CartItem.findOne({
					_id: order.cartItem,
				});

				if (!cart) {
					console.log(order._id);
					throw new NotFoundError("Cart item not found");
				}

				customerData.push({
					CustomerID: order.user.toString(),
					InvoiceNo: order._id,
					InvoiceDate: order.createdAt,
					Quantity: cart.quantity,
					UnitPrice: cart.amount,
				});
			})
		);

		if (customerData.length === 0) {
			return res.send(
				successResponse(
					"No customer segmentation data available for this shop",
					null
				)
			);
		}

		const segmentationData = await getCustomerSegmentData(
			customerData
		);

		const categories = [
			"Best Customer",
			"Top Spender",
			"Loyal Customers",
			"New Customer",
			"Low-End Customer",
		];

		// Calculate the total sum of quantities across all categories
		const totalQuantitySum = categories.reduce(
			(sum, category) => {
				const categoryData = segmentationData.filter(
					(data: any) => data.Segmentation === category
				);
				return sum + categoryData.length;
			},
			0
		);

		// Process segmentation data to calculate accurate percentages and quantities

		let response = categories.map((category) => {
			const categoryData = segmentationData.filter(
				(data: any) => data.Segmentation === category
			);
			const quantity = categoryData.length;

			// Calculate the percentage for each category
			const percentage =
				totalQuantitySum > 0
					? (quantity / totalQuantitySum) * 100
					: 0;

			return {
				category,
				percentage: percentage.toFixed(2),
				quantity,
			};
		});

		const totalNumber = response.reduce(
			(sum, { quantity }) => sum + quantity,
			0
		);
		if (totalNumber === 0) {
			response = null;
			console.log(
				"No segmentation data available:",
				response
			);
		}
		// //  save shop permission activities
		await saveShopAction(
			userId,
			"viewed shop analysis",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"Shop customer segmentation retrieved successfully",
				{
					response,
					totalNumber,
				}
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleShopCustomerSegmentation = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const userService = req.userService;
		const segmentName = req.query.segmentName as string;
		const shopId = req.params.shopId;

		// check permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"analysis"
		);

		const customerData: CustomerData[] = [];

		// Response Model
		const response = {
			gender: {
				male: 0,
				female: 0,
			},
			ageGroup: {
				from18to24: 0,
				from25to34: 0,
				from35to44: 0,
				from45to64: 0,
			},
			topState: {},
			topLga: {},
		};

		// state array
		const statesRecord: string[] = [];
		const lgasRecord: string[] = [];

		// Get user shop
		const shop = await Shop.findOne({
			_id: shopId,
			status: StatusTypes.ACTIVE,
		});
		if (!shop)
			throw new NotFoundError("No active shop found");

		// Get shop orders
		const orders = await Order.find({
			shop: shop._id,
		});

		await Promise.all(
			orders.map(async (order) => {
				const cart = await CartItem.findOne({
					_id: order.cartItem,
				});
				if (!cart) {
					console.warn(
						`Cart item not found for order ${order._id}`
					);
					return;
				}

				// Extract Location Data
				const address = await UserDeliveryAddress.findOne({
					userId: cart.user,
				}).populate({
					path: "addresses.state",
					select: "_id name",
				});

				const singleAddress = address.addresses.find(
					(address) =>
						address._id.equals(order.deliveryAddress)
				);

				if (singleAddress) {
					//@ts-ignore
					statesRecord.push(singleAddress.state.name);
					lgasRecord.push(singleAddress.lga);
				}

				customerData.push({
					CustomerID: cart.user.toString(),
					InvoiceNo: order._id,
					InvoiceDate: order.createdAt,
					Quantity: cart.quantity,
					UnitPrice: cart.amount,
				});
			})
		);

		if (customerData.length === 0) {
			return res.send(
				successResponse(
					"No customer segmentation data available for this shop",
					null
				)
			);
		}

		// Get segmentation data
		const segmentationData = await getCustomerSegmentData(
			customerData
		);

		// Process segmentation data to categorize and calculate percentages and quantities
		const categories = {
			best: "Best Customer",
			top: "Top Spender",
			loyal: "Loyal Customers",
			new: "New Customer",
			low: "Low-End Customer",
		};
		// Map the segmentName to the corresponding category value
		const categoryValue = categories[segmentName];
		if (!categoryValue)
			throw new NotFoundError(
				"Invalid segment name provided"
			);

		// Filter customer IDs by mapped category value
		const filteredCustomerIds = segmentationData
			.filter(
				(data: any) => data.Segmentation === categoryValue
			)
			.map((data: any) => data.CustomerID);

		await Promise.all(
			filteredCustomerIds.map(async (id) => {
				const customer = await checkUserById(
					id,
					userService
				);

				// Get gender grouping
				if (customer.gender === "Female") {
					response.gender.female += 1;
				} else {
					response.gender.male += 1;
				}

				// Get age grouping
				const age = differenceInYears(
					new Date(),
					new Date(customer.dob)
				);
				if (age >= 18 && age <= 24) {
					response.ageGroup.from18to24 += 1;
				} else if (age >= 25 && age <= 34) {
					response.ageGroup.from25to34 += 1;
				} else if (age >= 35 && age <= 44) {
					response.ageGroup.from35to44 += 1;
				} else if (age >= 45 && age <= 64) {
					response.ageGroup.from45to64 += 1;
				}

				// Calculate top states and LGAs
				const stateCounts = _.countBy(statesRecord);
				const lgaCounts = _.countBy(lgasRecord);

				const totalStates = statesRecord.length;
				const totalLgas = lgasRecord.length;

				const sortedStates = Object.entries(stateCounts)
					.sort(([, a], [, b]) => b - a)
					.slice(0, 3);

				const sortedLgas = Object.entries(lgaCounts)
					.sort(([, a], [, b]) => b - a)
					.slice(0, 5);

				sortedStates.forEach(([state, count]) => {
					response.topState[state] =
						((count / totalStates) * 100).toFixed(2) + "%";
				});

				sortedLgas.forEach(([lga, count]) => {
					response.topLga[lga] =
						((count / totalLgas) * 100).toFixed(2) + "%";
				});
			})
		);
		//  save shop permission activities
		await saveShopAction(
			userId,
			"viewed shop analysis",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"Shop single segment analytics retrieved successfully",
				response
			)
		);
	} catch (error) {
		next(error);
	}
};

export const changeOrderStatusForQA = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		// Limiting who can use this endpoint
		if (userId !== 15 && userId !== 201) {
			throw new ValidationError(
				"Not authorized to use this endpoint"
			);
		}
		const id = req.params.id;
		const choice: boolean = req.body.choice;

		const order = await Order.findOne({ _id: id });
		if (!order) {
			throw new NotFoundError("Order not found");
		}

		if (choice) {
			order.status = OrderStatus.DELIVERED;
			order.deliveryStatus = OrderDeliveryStatus.DELIVERED;
		} else {
			order.status = OrderStatus.PENDING;
			order.deliveryStatus = OrderDeliveryStatus.PENDING;
		}

		await order.save();

		return res.send(
			successResponse(
				"Order status changed successfully",
				order
			)
		);
	} catch (error) {
		next(error);
	}
};

export const readyForShipping = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const orderGroupId = req.params.id;

		// Find the shop associated with the user
		const shop = await Shop.findOne({ user: userId });
		if (!shop) throw new NotFoundError("Shop not found");

		// Find the order group by ID
		const orderGroup = await OrderGroup.findOne({
			_id: orderGroupId,
			status: OrderStatus.ACCEPTED,
			deliveryStatus: OrderDeliveryStatus.PACKAGING,
		});
		if (!orderGroup)
			throw new NotFoundError("Order group not found");

		// Update the order group status and delivery status
		orderGroup.deliveryStatus =
			OrderDeliveryStatus.DISPATCHED;
		// @ts-ignore
		orderGroup.status = OrderStatus.READYFORPICKUP;
		await orderGroup.save();

		const todaysDate = new Date();

		// Update each order in the order group
		for (const order of orderGroup.orders) {
			await Order.findByIdAndUpdate(order, {
				status: OrderStatus.READYFORPICKUP,
				delivery: OrderDeliveryStatus.DISPATCHED,
				packageTime: todaysDate,
			});
		}

		return res.send(
			successResponse(
				"Order ready for pickup initiated successfully",
				orderGroup
			)
		);
	} catch (error) {
		next(error);
	}
};

// Cron Function For Orders
const pendingOrdersNotifications = async (
	duration: number
) => {
	try {
		const targetTime = new Date(
			Date.now() - duration * 60 * 1000
		);
		const targetTimePlusBuffer = new Date(
			targetTime.getTime() + 10000
		);

		// Find orders that have been pending for the exact specified duration
		const orders = await OrderGroup.find({
			status: OrderStatus.PENDING,
			deliveryStatus: OrderDeliveryStatus.PENDING,
			createdAt: {
				$gte: targetTime,
				$lt: targetTimePlusBuffer,
			},
		});

		console.log("Found orders:", orders);

		if (orders.length === 0) {
			return [];
		}

		// Extract unique shop IDs from orders
		const shopIds = [
			...new Set(orders.map((order) => order.shop)),
		];

		// Find all shops in a single query
		const shops = await Shop.find({
			_id: { $in: shopIds },
		});

		if (shops.length === 0) {
			console.log("No shops found for the given orders.");
			return [];
		}

		// Extract vendor IDs from valid shops
		const vendorIds = shops.map((shop) => shop.user);

		if (vendorIds.length === 0) {
			console.log(
				"No vendors associated with the found shops."
			);
			return [];
		}

		// Send notifications to vendors
		for (const vendorId of vendorIds) {
			try {
				const user = await userNotificationInfo(vendorId);

				if (!user) {
					console.log(
						`No user information found for vendor ID: ${vendorId}`
					);
					continue;
				}

				const title = "Urgent: Please Accept the New Order";
				const message = `
          Dear Vendor,\n\n

          You have a new order that requires your attention. Please review and accept the order within the next ${duration} minutes to ensure timely processing. If you do not accept the order within this period, our customer support team will be notified.\n

          Thank you for your prompt action.\n\n

          Best regards,\n
          Motopay E-commerce
        `;
				await notificationService(
					"Motopay E-commerce",
					user,
					title,
					message
				);
			} catch (notificationError) {
				console.error(
					`Error sending notification to vendor ID: ${vendorId}`,
					notificationError
				);
			}
		}
	} catch (error) {
		console.error("Error checking order status:", error);
		throw error;
	}
};

const acceptedOrderNotification = async (
	duration: number
) => {
	try {
		const targetTime = new Date(
			Date.now() - duration * 60 * 1000
		);
		const targetTimePlusBuffer = new Date(
			targetTime.getTime() + 10000
		);

		// Find orders that have been accepted for the exact specified duration
		const orders = await OrderGroup.find({
			status: OrderStatus.ACCEPTED,
			deliveryStatus: OrderDeliveryStatus.PACKAGING,
			createdAt: {
				$gte: targetTime,
				$lt: targetTimePlusBuffer,
			},
		});

		console.log("Found orders:", orders);

		if (orders.length === 0) {
			return [];
		}

		// Extract unique shop IDs from orders
		const shopIds = [
			...new Set(orders.map((order) => order.shop)),
		];

		// Find all shops in a single query
		const shops = await Shop.find({
			_id: { $in: shopIds },
		});

		if (shops.length === 0) {
			console.log("No shops found for the given orders.");
			return [];
		}

		// Extract vendor IDs from valid shops
		const vendorIds = shops.map((shop) => shop.user);

		if (vendorIds.length === 0) {
			console.log(
				"No vendors associated with the found shops."
			);
			return [];
		}

		// Send notifications to vendors
		for (const vendorId of vendorIds) {
			try {
				const user = await userNotificationInfo(vendorId);

				if (!user) {
					console.log(
						`No user information found for vendor ID: ${vendorId}`
					);
					continue;
				}

				const title =
					"Reminder: Please Dispatch Your Goods";
				const message = `
          Dear Vendor,\n\n

          This is a friendly reminder to dispatch your goods as soon as possible. Timely dispatch is crucial to ensure smooth delivery and customer satisfaction.\n

          Thank you for your prompt attention to this matter.\n

          Best regards,\n
          Motopay E-commerce
        `;
				await notificationService(
					"Motopay E-commerce",
					user,
					title,
					message
				);
			} catch (notificationError) {
				console.error(
					`Error sending notification to vendor ID: ${vendorId}`,
					notificationError
				);
			}
		}
	} catch (error) {
		console.error("Error checking order status:", error);
		throw error;
	}
};

// const autoRejectPendingOrders = async () => {
// 	const session = await mongoose.startSession();
// 	try {
// 		session.startTransaction();
// 		// Define the duration for 12 hours
// 		const twelveHoursAgo = new Date(
// 			Date.now() - 12 * 60 * 60 * 1000
// 		);

// 		// Find orders that have been pending for more than 12 hours
// 		const orderGroups = await OrderGroup.find({
// 			status: OrderStatus.PENDING,
// 			deliveryStatus: OrderDeliveryStatus.PENDING,
// 			createdAt: {
// 				$lt: twelveHoursAgo,
// 			},
// 		}).session(session);

// 		for (const singleOrderGroup of orderGroups) {
// 			const orderGroup = (await OrderGroup.findById(
// 				singleOrderGroup._id
// 			).populate("deliveryMerchant")) as IOrderGroup;

// 			if (!orderGroup) {
// 				console.log(
// 					`Order group with ID ${singleOrderGroup._id} not found.`
// 				);
// 				continue;
// 			}

// 			await rejectOrderService(
// 				orderGroup,
// 				singleOrderGroup.user,
// 				session
// 			);

// 			// Send notification to Vendor
// 			const shop = await Shop.findOne(orderGroup.shop);
// 			const vendor = await userNotificationInfo(shop.user);
// 			const vendorTitle = "Order Auto-Rejected";
// 			const vendorMessage = `
// 			Dear Vendor,\n\n
// 			The order has been auto-rejected and the customer has been refunded.\n
// 			Best regards,\n
// 			Motopay E-commerce
// 			`;
// 			await notificationService(
// 				"Motopay",
// 				vendor,
// 				vendorTitle,
// 				vendorMessage
// 			);

// 			// Send notification to User
// 			const user = await userNotificationInfo(
// 				orderGroup.user
// 			);
// 			const userTitle = "Order Update";
// 			const userMessage = `
// 			Your order has been rejected and a refund has been issued. You can place a new order from another shop.\n\n
// 			Best regards\n
//             Motopay E-commerce
// 			`;
// 			await notificationService(
// 				"Motopay",
// 				user,
// 				userTitle,
// 				userMessage
// 			);
// 		}
// 		await session.commitTransaction();
// 	} catch (error) {
// 		console.error(
// 			"Error fetching stale pending orders:",
// 			error
// 		);
// 		await session.abortTransaction();
// 		session.endSession();
// 		throw error;
// 	}
// };

// const autoRejectAcceptedOrders = async () => {
// 	const session = await mongoose.startSession();
// 	try {
// 		session.startTransaction();
// 		// Define the duration for 12 hours
// 		const twelveHoursAgo = new Date(
// 			Date.now() - 12 * 60 * 60 * 1000
// 		);

// 		// Find orders that have been pending for more than 12 hours
// 		const orderGroups = await OrderGroup.find({
// 			status: OrderStatus.ACCEPTED,
// 			deliveryStatus: OrderDeliveryStatus.PACKAGING,
// 			createdAt: {
// 				$lt: twelveHoursAgo,
// 			},
// 		}).session(session);

// 		for (const singleOrderGroup of orderGroups) {
// 			const orderGroup = (await OrderGroup.findById(
// 				singleOrderGroup._id
// 			).populate("deliveryMerchant")) as IOrderGroup;

// 			if (!orderGroup) {
// 				console.log(
// 					`Order group with ID ${singleOrderGroup._id} not found.`
// 				);
// 				continue;
// 			}

// 			await rejectOrderService(
// 				orderGroup,
// 				singleOrderGroup.user,
// 				session
// 			);

// 			// Send notification to Vendor
// 			const shop = await Shop.findOne(orderGroup.shop);
// 			const vendor = await userNotificationInfo(shop.user);
// 			const vendorTitle = "Order Auto-Rejected";
// 			const vendorMessage = `
// 			Dear Vendor,\n\n
// 			The order has been auto-rejected and the customer has been refunded.\n
// 			Best regards,\n
// 			Motopay E-commerce
// 			`;
// 			await notificationService(
// 				"Motopay",
// 				vendor,
// 				vendorTitle,
// 				vendorMessage
// 			);

// 			// Send notification to User
// 			const user = await userNotificationInfo(
// 				orderGroup.user
// 			);
// 			const userTitle = "Order Update";
// 			const userMessage = `
// 			Your order has been rejected and a refund has been issued. You can place a new order from another shop.\n\n
// 			Best regards\n
//             Motopay E-commerce
// 			`;
// 			await notificationService(
// 				"Motopay",
// 				user,
// 				userTitle,
// 				userMessage
// 			);
// 		}
// 		await session.commitTransaction();
// 	} catch (error) {
// 		console.error(
// 			"Error fetching stale pending orders:",
// 			error
// 		);
// 		await session.abortTransaction();
// 		session.endSession();
// 		throw error;
// 	}
// };

// Cron Job for every 24 hours (1 day)
cron.schedule("0 0 * * *", async () => {
	// Alert vendor and User about rejected Order and refund
	// await autoRejectPendingOrders();
	// await autoRejectAcceptedOrders();
});

// Cron Job for every 1 minute
cron.schedule("* * * * *", async () => {
	// Notification For Pending Orders
	// Notify Vendor After 5mins
	await pendingOrdersNotifications(5);
	// Notify Vendor After 30mins
	await pendingOrdersNotifications(30);
	// Notify Vendor After 4hrs
	await pendingOrdersNotifications(240);
	// Notify Vendor After 7hrs
	await pendingOrdersNotifications(420);

	// Notification for Accepted Orders
	// Notify Vendor After 5mins
	await acceptedOrderNotification(5);
	// Notify Vendor After 30mins
	await acceptedOrderNotification(30);
	// Notify Vendor After 4hrs
	await acceptedOrderNotification(240);
	// Notify Vendor After 7hrs
	await acceptedOrderNotification(420);
});
