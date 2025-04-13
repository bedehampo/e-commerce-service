import { NotFoundError, ServiceError } from "../../errors";
// import { User } from "../../model/User";
import { DeliveryMerchant } from "../../model/shop/deliveryMerchant";
import { Product } from "../../model/shop/product";
import { InitiateOrderInput } from "../../validation/order.schema";
import { Order } from "../../model/shop/order";
import { CartItem } from "../../model/shop/cartItem";
import { OrderPaymentGroup } from "../../model/shop/OrderPaymentGroup";
import { OrderDeliveryPrices } from "../../model/shop/orderDeliveryPrices";
import { IDeliveryDetails } from "./calculateDeliveryPriceService";
import {
	CartItemStatus,
	DeliveryCompanies,
	IShopDeliveryDetails,
	DeliveryOrderInterface,
	OrderStatus,
	OrderType,
	SelfPickupOrderInterface,
	TransactionDetailsItem,
	OrderPaymentType,
} from "../../types/order";
import { IUser } from "../../types/user";
import { checkUserById } from "../../middlewares/validators";
import { UserService } from "../../lib/userService";
import { TransactionService } from "../../lib/transactionService";
import { generateTransactionReference } from "../../utils/global";
import { Shop } from "../../model/shop/shop";
import {
	TransactionStatusCode,
	TransactionType,
} from "../../types/transactions";
import { OrderGroup } from "../../model/shop/OrderGroup";
import { BNPLItemRecordModel } from "../../model/shop/bnplItemRecord";
import { Colour } from "../../model/color";

const initiateOrderService = async (
	params: InitiateOrderInput["body"],
	userId: number,
	session: any,
	userService: UserService,
	transactionService: TransactionService
) => {
	const {
		deliveryMerchant,
		deliveryDetailsId,
		orderType,
		pickUpDateTime,
		// payOnDelivery,
		// buyNowPayLater,
		paymentType,
		// payWithMotoPayWallet,
		cartItemIds,
	} = params;
	const user = await checkUserById(userId, userService);

	if (!user) {
		throw new NotFoundError("User not found");
	}

	// get cart items
	const cart = await CartItem.find({
		user: userId,
		status: CartItemStatus.ACTIVE,
		_id: { $in: cartItemIds },
	})
		.populate({
			path: "product",
			model: Product,
			populate: {
				path: "shop",
				model: Shop,
			},
		})
		.sort({ createdAt: -1 })
		.exec();

	if (!cart.length) {
		throw new NotFoundError("Cart is empty");
	}

	// Verify that the items quantity is equal or less than product quantity
	for (const item of cart) {
		const product = item.product;
		const selectedColor = item.selectColorImage.color;
		const color = await Colour.findOne({
			_id: selectedColor,
		});

		// Find the product image that matches the selected color
		//@ts-ignore
		const productImage = product.productImages.find(
			(image) =>
				image.color.toString() === selectedColor.toString()
		);

		if (!productImage) {
			throw new Error(
				`Product image with the selected color not found for.`
			);
		}

		// Check the quantity of the selected product image
		if (productImage.quantity < item.quantity) {
			// @ts-ignore
			const productName = product.productName;
			const qty = productImage.quantity;
			const colorName = color
				? color.name
				: "unknown color"; // Assuming 'name' is the field for color name
			throw new Error(
				`Insufficient stock for ${productName} in color ${colorName}. Available: ${qty}, Requested: ${item.quantity}`
			);
		}
	}

	// initialize subTotal and totalDiscount
	let subTotal = 0;
	let totalDiscount = 0;

	// calculate subTotal and totalDiscount from cart items
	cart.forEach((item) => {
		subTotal += item.amount * item.quantity;
		totalDiscount +=
			//@ts-ignore
			item.product.discountAmount * item.quantity;
	});

	const orders = [];
	const items: TransactionDetailsItem[] = [];
	const shopIds: Set<string> = new Set();
	let bnplItemRecord;

	if (orderType === OrderType.DELIVERY) {
		const deliveryMerchantDetails =
			await DeliveryMerchant.findById(deliveryMerchant);
		if (!deliveryMerchantDetails) {
			throw new NotFoundError(
				"Delivery merchant not found"
			);
		}

		const orderdeliveryprices =
			await OrderDeliveryPrices.findById(deliveryDetailsId);

		if (!orderdeliveryprices) {
			throw new NotFoundError(
				"Order delivery details not found"
			);
		}

		let merchantNameMapping = {
			[DeliveryCompanies.Orion]: "orion",
			[DeliveryCompanies.Athena]: "athena",
			[DeliveryCompanies.Gig]: "gig",
			[DeliveryCompanies.Kwik]: "kwik",
			[DeliveryCompanies.Dellyman]: "dellyman",
		};

		const deliveryDetails: {
			price: number;
			merchantId: string;
			deliveryDetails: IDeliveryDetails[];
		} =
			orderdeliveryprices[
				merchantNameMapping[deliveryMerchantDetails.name]
			];

		//check if user has purchased a product before, that is a returning customer
		let isUserReturningCustomer: boolean = false;

		const findOrderPurchasedByUser = await Order.findOne({
			user: userId,
			status: OrderStatus.DELIVERED,
		});

		if (findOrderPurchasedByUser) {
			isUserReturningCustomer = true;
		}

		for (const item of cart) {
			let subTotalPrice =
				Number(item.amount) * Number(item.quantity);
			const transactionReference =
				generateTransactionReference(10);
			//@ts-ignore
			const shopOwnerUserId = item.product.shop?.user;
			const showOwner = await checkUserById(
				shopOwnerUserId,
				userService
			);
			// let discountPrice =
			//   //@ts-ignore
			//   Number(item.product.discountAmount) * Number(item.quantity);

			console.log("subTotalPrice", subTotalPrice);
			// console.log("discountPrice", discountPrice);
			let order: DeliveryOrderInterface = {
				user: userId,
				//@ts-ignore
				cartItem: item._id,
				price: subTotalPrice,
				status:
					paymentType === OrderPaymentType.PAYONDELIVERY
						? OrderStatus.PENDING
						: OrderStatus.INITIATED,
				paymentMethod: "wallet",
				receiversName: orderdeliveryprices.receiversName,
				receiversPhoneNumber:
					orderdeliveryprices.receiversPhoneNumber,
				deliveryAddress:
					orderdeliveryprices.deliveryAddress,
				deliveryAddressDescription:
					orderdeliveryprices.deliveryAddressDescription,
				//@ts-ignore
				shop: item.shop,
				orderType,
				//@ts-ignore
				product: item.product,
				//@ts-ignore
				custom_field: item.custom_field,
				transactionReference: transactionReference,
				returningCustomer: isUserReturningCustomer,
			};

			const transactionItem: TransactionDetailsItem = {
				parentRef: transactionReference,
				amount: order.price,
				accountNo: showOwner.accountNumber,
				//@ts-ignore
				shopName: item.product.shop?.brand_name,
				//@ts-ignore
				itemName: item.product.productName,
				//@ts-ignore
				quantity: item.quantity,
			};
			items.push(transactionItem);
			orders.push(order);
			//@ts-ignore
			shopIds.add(item.shop);
		}

		const savedOrders = await Order.insertMany(orders, {
			session,
		});

		let shopDeliveryDetails: IShopDeliveryDetails[] = [];

		// let shopDeliveryIds = Object.keys(shopOrderMapping);
		for (let shopId of shopIds) {
			let shopDetail = deliveryDetails.deliveryDetails.find(
				(detail) => {
					return (
						detail.shop.toString() === shopId.toString()
					);
				}
			);

			let shopDeliveryDetail = {
				shop: shopId as string,
				quantity: shopDetail.quantity as number,
				deliveryCost: shopDetail.deliveryCost as number,
			};
			shopDeliveryDetails.push(shopDeliveryDetail);
		}

		let totalDeliveryFee = deliveryDetails.price;
		console.log("passed 1");

		const orderPaymentGroupPayload = new OrderPaymentGroup({
			user: userId,
			orders: savedOrders.map((order) => order._id),
			totalDeliveryFee: deliveryDetails.price,
			totalDiscount,
			subTotal,
			deliveryMerchant,
			shopDeliveryDetails,
			orderType,
			receiversName: orderdeliveryprices.receiversName,
			receiversPhoneNumber:
				orderdeliveryprices.receiversPhoneNumber,
			deliveryAddress: orderdeliveryprices.deliveryAddress,
			deliveryAddressDescription:
				orderdeliveryprices.deliveryAddressDescription,
			// totalAmount:
			// 	Number(subTotal) +
			// 	Number(totalDeliveryFee) -
			// 	Number(totalDiscount),
			totalAmount:
				Number(subTotal) + Number(totalDeliveryFee),
			paymentType,
			orderDeliveryDetails: deliveryDetailsId,
		});

		console.log("passed 2");

		// Buy now and pay later
		if (paymentType === OrderPaymentType.BUYNOWPAYLATER) {
			bnplItemRecord = new BNPLItemRecordModel({
				user: userId,
				items: items,
				orderPaymentGroupId: orderPaymentGroupPayload._id,
			});
			savedOrders.forEach(async (order) => {
				order.paymentType = OrderPaymentType.BUYNOWPAYLATER;
				await order.save({ session });
			});
		}
		// if (paymentType === OrderPaymentType.BUYNOWPAYLATER) {
		// 	savedOrders.forEach((order) => {
		// 		order.paymentType = OrderPaymentType.BUYNOWPAYLATER;

		// 		bnplItemRecord = new BNPLItemRecordModel({
		// 			user: userId,
		// 			items: items,
		// 			orderPaymentGroupId: orderPaymentGroupPayload._id,
		// 		});
		// 		order.save({ session });
		// 	});
		// }

		//if payment type is pay by wallet then initiate transaction
		if (paymentType === OrderPaymentType.PAYBYWALLET) {
			console.log("pay on delivery");
			const response = await initiateTransactionCall(
				totalDeliveryFee,
				transactionService,
				items,
				orderType
			);
			orderPaymentGroupPayload.transactionReference =
				response.data.transactionRef;
		}

		//save Order payment group
		const orderPaymentGroup =
			await orderPaymentGroupPayload.save({
				session,
			});
		if (bnplItemRecord) {
			bnplItemRecord.orderPaymentGroupId =
				orderPaymentGroup._id;
			await bnplItemRecord.save({ session });
		}

		//if pay on delivery then  create the shop order mapping and create the order group  for each shop
		if (paymentType === OrderPaymentType.PAYONDELIVERY) {
			const shopOrderMapping = {};
			for (const order of orders) {
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

				let deliveryDetail = shopDeliveryDetails.find(
					(detail) => detail.shop.toString() === shopId
				);

				let orderGroupPayload = {
					shop: shopId,
					user: userId,
					totalAmount,
					totalDeliveryFee: deliveryDetail.deliveryCost,
					deliveryMerchant,
					receiversName: orderdeliveryprices.receiversName,
					receiversPhoneNumber:
						orderdeliveryprices.receiversPhoneNumber,
					paymentType: paymentType,
					deliveryAddress:
						orderdeliveryprices.deliveryAddress,
					deliveryAddressDescription:
						orderdeliveryprices.deliveryAddressDescription,
					orders: orders.map((order) => order._id),
					orderType,
					orderDeliveryDetails: deliveryDetailsId,
				};
				orderGroupPayloadStore.push(orderGroupPayload);
				const orderGroup = await new OrderGroup(
					orderGroupPayload
				);
				await orderGroup.save({ session });
			}

			await CartItem.updateMany(
				{
					user: userId,
					status: CartItemStatus.ACTIVE,
					_id: { $in: cartItemIds },
				},
				{ $set: { status: CartItemStatus.ORDERED } },
				{ session }
			);
		}

		await session.commitTransaction();
		session.endSession();
		return {
			orderPaymentGroup,
			firstOrderId: savedOrders[0]._id,
			subTotal,
			totalDiscount,
			totalDeliveryFee,
		};
	}
	if (orderType === OrderType.SELF_PICKUP) {
		return await selfPickUp(
			cart,
			userId,
			pickUpDateTime,
			orderType,
			user,
			items,
			orders,
			transactionService,
			session,
			totalDiscount,
			subTotal
		);
	}
};

export default initiateOrderService;

export const initiateTransactionCall = async (
	totalDeliveryFee: number,
	transactionService: TransactionService,
	items: TransactionDetailsItem[],
	orderType: OrderType
) => {
	const transactionReference =
		generateTransactionReference(10);

	console.log("items", items);

	const response =
		await transactionService.initiateTransaction({
			transactionType: TransactionType.PURCHASE,
			transactionDetailsDto: {
				fee: totalDeliveryFee,

				transactionRef: transactionReference,
				description: "Multiple order purchase",
				items,
			},
		});

	if (response.code !== TransactionStatusCode.SUCCESSFUL) {
		throw new ServiceError(response.description);
	}
	return response;
};

const selfPickUp = async (
	cart,
	userId,
	pickUpDateTime,
	orderType,
	user,
	items,
	orders,
	transactionService: TransactionService,
	session: any,
	totalDiscount,
	subTotal
) => {
	for (const item of cart) {
		let subTotalPrice =
			Number(item.amount) * Number(item.quantity);
		let discountPrice =
			//@ts-ignore
			Number(item.product.discountAmount) *
			Number(item.quantity);
		let order: SelfPickupOrderInterface = {
			user: userId,
			//@ts-ignore
			cartItem: item._id,
			price: subTotalPrice - discountPrice,
			status: OrderStatus.PENDING,
			paymentMethod: "wallet",
			pickUpDateTime,
			//@ts-ignore
			shop: item.shop,
			orderType,
			//@ts-ignore
			product: item.product,
			//@ts-ignore
			custom_field: item.custom_field,
		};
		const transactionReference =
			generateTransactionReference(10);
		const transactionItem: TransactionDetailsItem = {
			parentRef: transactionReference,
			amount: order.price,
			accountNo: user.accountNumber,
			//@ts-ignore
			shopName: item.product.shop?.brand_name,
			//@ts-ignore
			itemName: item.product.productName,
			//@ts-ignore
			quantity: item.quantity,
		};
		items.push(transactionItem);
		orders.push(order);

		//@ts-ignore
		shopIds.add(item.shop);
	}

	const transactionReference =
		generateTransactionReference(10);
	const response =
		await transactionService.initiateTransaction({
			transactionType: "PURCHASE",
			transactionDetailsDto: {
				// amount:
				fee: 0,
				//   Number(subTotal) + Number(totalDeliveryFee) - Number(totalDiscount),
				transactionRef: transactionReference,

				// phone: user.mobileNumber,
				description: "Multiple order purchase",
				// customerUniqueIdentifier: user.id,
				items,
			},
		});
	if (response.code !== TransactionStatusCode.SUCCESSFUL) {
		throw new ServiceError(response.description);
	}

	const savedOrders = await Order.insertMany(orders, {
		session,
	});

	const orderPaymentGroupPayload = new OrderPaymentGroup({
		user: userId,
		orders: savedOrders.map((order) => order._id),
		totalDiscount,
		subTotal,
		orderType,
		transactionReference: response.data.transactionRef,
		totalAmount: Number(subTotal) - Number(totalDiscount),
	});

	//save Order payment group
	const orderPaymentGroup =
		await orderPaymentGroupPayload.save({
			session,
		});

	await session.commitTransaction();
	session.endSession();
	return {
		orderPaymentGroup,
		subTotal,
		totalDiscount,
	};
};
