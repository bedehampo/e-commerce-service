import mongoose from "mongoose";
import { NotFoundError, ServiceError } from "../../errors";
import { OrderPaymentGroup } from "../../model/shop/OrderPaymentGroup";
import { Product } from "../../model/shop/product";
import { OrderGroup } from "../../model/shop/OrderGroup";
import {
	CartItemStatus,
	OrderPaymentGroupInterface,
	OrderPaymentStatus,
	OrderStatus,
	OrderType,
} from "../../types/order";
import { CartItem } from "../../model/shop/cartItem";
import { UserService } from "../../lib/userService";
import { checkUserById } from "../../middlewares/validators";
import { TransactionService } from "../../lib/transactionService";
import { TransactionStatusCode } from "../../types/transactions";
import { Order } from "../../model/shop/order";
import { notificationService } from "../../utils/global";
import { Shop } from "../../model/shop/shop";
import { Colour } from '../../model/color';

const completeOrderService = async (
	order_payment_group: string,
	userId,
	pin,
	session: any,
	userService: UserService,
	transactionService: TransactionService
): Promise<OrderPaymentGroupInterface> => {
	const user = await checkUserById(userId, userService);

	if (!user) {
		throw new NotFoundError("User not found");
	}
	const orderPaymentGroupExists =
		(await OrderPaymentGroup.findById(
			order_payment_group
		).populate({
			path: "orders",
			model: Order,
			populate: {
				path: "cartItem",
				model: CartItem,
				populate: { path: "product", model: Product },
			},
		})) as OrderPaymentGroupInterface;

	// check if order exists
	if (!orderPaymentGroupExists) {
		throw new NotFoundError("Order not found");
	}

	// Validate stock quantities for each order
	for (const order of orderPaymentGroupExists.orders) {
		const cartItem = order.cartItem;
		const product = cartItem.product;
		// @ts-ignore
		const selectedColor = cartItem.selectColorImage.color; 

		// Find the product image that matches the selected color
		//@ts-ignore
		const productImage = product.productImages.find(
			(image) =>
				image.color.toString() === selectedColor.toString()
		);

		if (!productImage) {
			throw new Error(
				`Product image with the selected color not found for ${product.productName}.`
			);
		}

		// Check the quantity of the selected product image
		const qty = productImage.quantity; 
		const cartQty = cartItem.quantity;

		if (qty < cartQty) {
			// Retrieve the color name from the Colour model
			const color = await Colour.findById(selectedColor);
			const colorName = color
				? color.name
				: "unknown color";
			throw new Error(
				`Insufficient stock for ${product.productName} in color ${colorName}. Available: ${qty}, Requested: ${cartQty}`
			);
		}
	}

	// check if order has been paid for already
	if (
		orderPaymentGroupExists.paymentStatus ===
		OrderPaymentStatus.PAID
	) {
		throw new NotFoundError(
			"Order has been paid for already"
		);
	}

	//check if user made the order
	if (orderPaymentGroupExists.user !== userId) {
		throw new NotFoundError(
			"You are not authorized to complete this order"
		);
	}
  // 

	const totalCost = orderPaymentGroupExists.totalAmount;
	let shopDeliveryDetails =
		orderPaymentGroupExists.shopDeliveryDetails;
	let response;
	if (
		orderPaymentGroupExists.orderType ===
		OrderType.SELF_PICKUP
	) {
		response = await transactionService.completeTransaction(
			pin,
			orderPaymentGroupExists.transactionReference,
			"no-merchant"
		);
	}

	//complete transaction for delivery
	if (
		orderPaymentGroupExists.orderType === OrderType.DELIVERY
	) {
		response = await transactionService.completeTransaction(
			pin,
			orderPaymentGroupExists.transactionReference,
			orderPaymentGroupExists.deliveryMerchant
		);
	}

	if (response.code !== TransactionStatusCode.SUCCESSFUL) {
		throw new ServiceError(response.description);
	}

	//check if user has purchased a product before, that is a returning customer
	let isUserReturningCustomer: Boolean = false;
	const findOrderPurchasedByUser = await Order.findOne({
		user: userId,
		status: OrderStatus.DELIVERED,
	});

	if (findOrderPurchasedByUser) {
		isUserReturningCustomer = true;
	}

	const shopOrderMapping = {};
	for (const order of orderPaymentGroupExists.orders) {
		//update popularity score , views of the product and stock quantity

		const productId = order.cartItem.product;
		const orderQuantity = order.cartItem.quantity;
		console.log("orderQuantity", orderQuantity);
		console.log("product Id ", productId);

		await Product.findByIdAndUpdate(
			productId,
			{
				$inc: {
					popularityScore: 1,
					stockQuantity: -orderQuantity,
				},
				$push: { views: userId },
			},
			{
				session,
			}
		);

		// update order payment status to paid, transaction reference and returning customer
		await Order.findByIdAndUpdate(
			order._id,
			{
				paymentStatus: OrderPaymentStatus.PAID,
				transactionReference:
					orderPaymentGroupExists.transactionReference,
				returningCustomer: isUserReturningCustomer,
				status: OrderStatus.PENDING,
			},
			{
				session,
			}
		);

		//update product stock quantity

		shopOrderMapping[order.shop] = shopOrderMapping[
			order.shop
		]
			? [...shopOrderMapping[order.shop], order]
			: [order];
	}

	let orderGroupPayloadStore = [];

	for (let shopId in shopOrderMapping) {
		let orders = shopOrderMapping[shopId];

		let totalAmount = orders.reduce((acc, order) => {
			return acc + order.price;
		}, 0);

		if (
			orderPaymentGroupExists.orderType ===
			OrderType.DELIVERY
		) {
			let deliveryDetail = shopDeliveryDetails.find(
				(detail) => detail.shop.toString() === shopId
			);

			let orderGroupPayload = {
				shop: new mongoose.Types.ObjectId(shopId),
				user: userId,
				totalAmount,
				totalDeliveryFee: deliveryDetail.deliveryCost,
				deliveryMerchant:
					orderPaymentGroupExists.deliveryMerchant,
				receiversName:
					orderPaymentGroupExists.receiversName,
				receiversPhoneNumber:
					orderPaymentGroupExists.receiversPhoneNumber,
				deliveryAddressDescription:
					orderPaymentGroupExists.deliveryAddressDescription,
				deliveryAddress:
					orderPaymentGroupExists.deliveryAddress,
				orders: orders.map((order) => order._id),
				orderType: orderPaymentGroupExists.orderType,
				orderDeliveryDetails:
					orderPaymentGroupExists.orderDeliveryDetails,
			};
			orderGroupPayloadStore.push(orderGroupPayload);
			const orderGroup = await new OrderGroup(
				orderGroupPayload
			);
			await orderGroup.save({ session });
		}

		if (
			orderPaymentGroupExists.orderType ===
			OrderType.SELF_PICKUP
		) {
			let orderGroupPayload = {
				shop: new mongoose.Types.ObjectId(shopId),
				user: userId,
				totalAmount,
				orders: orders.map((order) => order._id),
				orderType: orderPaymentGroupExists.orderType,
			};
			const orderGroup = await new OrderGroup(
				orderGroupPayload
			);
			await orderGroup.save({ session });
		}
	}

	//update payment status
	orderPaymentGroupExists.paymentStatus =
		OrderPaymentStatus.PAID;
	// orderPaymentGroupExists.transactionReference = customerTransaction._id;
	await orderPaymentGroupExists.save({ session });

	//clear cart items from cart

	//update cart items to inactive

	const cartitemIds = orderPaymentGroupExists.orders.map(
		(order) => order.cartItem
	);
	await CartItem.updateMany(
		{
			user: userId,
			status: CartItemStatus.ACTIVE,
			_id: { $in: cartitemIds },
		},
		{ $set: { status: CartItemStatus.ORDERED } },
		{ session }
	);

	//sending notification to shop owner
	//   for (let shopId in shopOrderMapping) {
	//     const shop = await Shop.findById(shopId);
	//     await notificationService(
	//       "MotoPay",
	//       shop.user,
	//       "Product payment",
	//       `Your product have being paid for`
	//     );
	//   }

	await session.commitTransaction();
	session.endSession();
	return orderPaymentGroupExists;
};

export default completeOrderService;
