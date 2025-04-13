import { NotFoundError } from "../../errors";
import { UserService } from "../../lib/userService";
import { OrderGroup } from "../../model/shop/OrderGroup";
import { Order } from "../../model/shop/order";
import { Shop } from "../../model/shop/shop";
import { OrderStatus } from "../../types/order";
import { StatusTypes } from "../../utils/interfaces";

const getShopOrdersService = async (
	userId,
	query: {
		status?: string;
	},
	userService: UserService
) => {
	const shop = await Shop.findOne({
		user: userId,
		status: StatusTypes.ACTIVE,
	});

	if (!shop) {
		throw new NotFoundError("Shop not found");
	}

	const shopId = shop._id;

	const payload: any = [
		{
			shop: shopId,
		},
	];

	if (query.status) {
		payload.push({
			status: query.status,
		});
	} else {
		// Status that is neither rejected nor cancelled
		payload.push({
			status: {
				$nin: [OrderStatus.REJECTED, OrderStatus.CANCELLED],
			},
		});
	}

	let orderGroups = await OrderGroup.aggregate([
		{
			$match: {
				$and: payload,
			},
		},
		// Populate delivery merchant
		{
			$lookup: {
				from: "merchants",
				localField: "deliveryMerchant",
				foreignField: "_id",
				as: "deliveryMerchant",
			},
		},
		{
			$unwind: {
				path: "$deliveryMerchant",
				preserveNullAndEmptyArrays: true,
			},
		},
		// Populate orders
		{
			$lookup: {
				from: "orders",
				localField: "orders",
				foreignField: "_id",
				as: "orders",
			},
		},
		{
			$unwind: {
				path: "$orders",
				preserveNullAndEmptyArrays: true,
			},
		},
		// Populate cart items in the orders
		{
			$lookup: {
				from: "cart_items",
				localField: "orders.cartItem",
				foreignField: "_id",
				as: "cartItems",
			},
		},
		{
			$unwind: {
				path: "$cartItems",
				preserveNullAndEmptyArrays: true,
			},
		},
		// Populate products in the cart items
		{
			$lookup: {
				from: "products",
				localField: "cartItems.product",
				foreignField: "_id",
				as: "cartItems.product",
			},
		},
		{
			$unwind: {
				path: "$cartItems.product",
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$group: {
				_id: "$_id",
				shop: { $first: "$shop" },
				orders: { $push: "$orders" },
				cartItems: { $push: "$cartItems" },
				user: { $first: "$user" },
				totalAmount: { $first: "$totalAmount" },
				orderType: { $first: "$orderType" },
				totalDeliveryFee: { $first: "$totalDeliveryFee" },
				deliveryMerchant: { $first: "$deliveryMerchant" },
				deliveryAddressDescription: {
					$first: "$deliveryAddressDescription",
				},
				receiversName: { $first: "$receiversName" },
				status: { $first: "$status" },
				receiversPhoneNumber: {
					$first: "$receiversPhoneNumber",
				},
				deliveryAddress: { $first: "$deliveryAddress" },
				createdAt: { $first: "$createdAt" },
				updatedAt: { $first: "$updatedAt" },
			},
		},
		{
			$project: {
				_id: 1,
				"orders.status": 1,
				"orders.price": 1,
				"orders._id": 1,
				"cartItems.product.productDescription": 1,
				"cartItems.product.productName": 1,
				"cartItems.product.productImage": 1,
				"cartItems.quantity": 1,
				"cartItems.amount": 1,
				"cartItems.selectColorImage": 1,
				totalAmount: 1,
				orderType: 1,
				totalDeliveryFee: 1,
				deliveryMerchant: 1,
				deliveryAddressDescription: 1,
				receiversName: 1,
				status: 1,
				receiversPhoneNumber: 1,
				deliveryAddress: 1,
				user: 1,
				createdAt: 1,
				updatedAt: 1,
			},
		},
		{
			$sort: {
				updatedAt: -1,
			},
		},
	]);

	orderGroups = await Promise.all(
		orderGroups.map(async (orderGroup) => {
			const user = await userService.getUserById(
				orderGroup.user
			);
			return {
				...orderGroup,
				user,
			};
		})
	);

	return orderGroups;
};

export default getShopOrdersService;

//6543baa61424c56d30421843
//6543baa61424c56d30421844
//6543baa61424c56d30421845
