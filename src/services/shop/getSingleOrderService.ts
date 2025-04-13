import {
	AuthorizationError,
	NotFoundError,
} from "../../errors";
import { OrderGroup } from '../../model/shop/OrderGroup';
import { OrderPaymentGroup } from "../../model/shop/OrderPaymentGroup";
import { Order } from "../../model/shop/order";
import { OrderStatus } from "../../types/order";

const getSingleOrderService = async (
	orderId: string,
	userId
) => {
	const order = await Order.findOne({ _id: orderId })
		.populate({
			path: "cartItem",
			select: "selectColorImage quantity",
			populate: {
				path: "product",
				select: "productName productDescription -_id",
			},
		})
		.populate({
			path: "shop",
			select: "brand_name -_id",
		})
		.populate({
			path: "orderPaymentGroup",
			populate: {
				path: "deliveryMerchant",
				select: "name",
			},
		});

	//orderPaymentGroup deliveryMerchant
	if (order.user.toString() !== userId.toString()) {
		throw new AuthorizationError(
			"You are not allowed to view this order"
		);
	}

	// Find the OrderGroup that contains the orderId
	const orderGroup = await OrderGroup.findOne({
		orders: { $in: [orderId] },
	});

	if (!orderGroup) {
		throw new NotFoundError("Order group not found");
	}

	// Get the displayId from the orderGroup
	const displayId = orderGroup.displayId;

	//find order payment group in which the orders field contains the order id
	const orderPaymentGroup = await OrderPaymentGroup.findOne(
		{
			orders: { $in: [orderId] },
		}
	)
		.populate({
			path: "orders",
			select: "cartItem price status",
			populate: {
				path: "cartItem",
				select: "product quantity -_id",
				populate: {
					path: "product",
				},
			},
		})
		.populate("deliveryMerchant");

	if (!orderPaymentGroup) {
		throw new NotFoundError("Order not found");
	}

	let no_of_items = 0;

	orderPaymentGroup.orders.forEach((order) => {
		//@ts-ignore
		const quantity = order.cartItem.quantity;
		//@ts-ignore
		no_of_items += quantity;
	});

	// get the orders in the order payment group but sort them so that the one with the _id field which is equal to the input orderId is the first
	const orders = orderPaymentGroup.orders.sort((a, b) => {
		// @ts-ignore
		if (a._id.toString() === orderId) {
			return -1;
		}
		return 1;
	});

	let orderDetails: {
		productName: string;
		productDescription: string;
		quantity: number;
		productImage: string;
		status: OrderStatus;
		amount: number;
		id: string;
	}[] = [];

	orders.forEach((order) => {
		//@ts-ignore
		const product = order.cartItem.product;
		//@ts-ignore
		const quantity = order.cartItem.quantity;

		orderDetails.push({
			// @ts-ignore
			_id: order._id,
			productName: product.productName,
			productDescription: product.productDescription,
			quantity: quantity,
			productImage: product.productImages[0],
			id: product._id,
			//@ts-ignore
			status: order.status,
			//@ts-ignore
			amount: order.price,
		});
	});

  const result: {
		displayId: string;
		datePlaced: Date;
		noOfItems: number;
		totalAmount: number;
		orders: {
			productName: string;
			productDescription: string;
			quantity: number;
			productImage: string;
			status: OrderStatus;
			amount: number;
		}[];

		paymentMethod: {
			noOfItems: number;
			totalAmount: number;
			deliveryFee: number;
		};
		shippingInformation: {
			deliveryMerchant: string;
			buyerAddress: string;
			receiversName: string;
		};
  } = {
    displayId:displayId,
		datePlaced: order.createdAt,
		noOfItems: no_of_items,
		totalAmount: Number(orderPaymentGroup.subTotal),
		orders: orderDetails,

		paymentMethod: {
			noOfItems: no_of_items,
			totalAmount: orderPaymentGroup.subTotal,
			deliveryFee: orderPaymentGroup.totalDeliveryFee,
		},
		shippingInformation: {
			// @ts-ignore
			deliveryMerchant: orderPaymentGroup.deliveryMerchant.name,
			buyerAddress:
				orderPaymentGroup.deliveryAddressDescription,
			receiversName: orderPaymentGroup.receiversName,
		},
	};

	return result;
};

export default getSingleOrderService;
