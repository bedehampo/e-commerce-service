import {
	AuthorizationError,
	NotFoundError,
	ValidationError,
} from "../../errors";
import { UserService } from "../../lib/userService";
import { checkUserById } from "../../middlewares/validators";
// import { User } from "../../model/User";
import { OrderGroup } from "../../model/shop/OrderGroup";
import { Order } from "../../model/shop/order";
import { RejectedOrderReason } from "../../model/shop/rejectedOrdersReason";
import { Shop } from "../../model/shop/shop";
import {
	IOrderGroup,
	OrderDeliveryStatus,
	OrderStatus,
	OrderType,
} from "../../types/order";
import { IUser } from "../../types/user";
import { notificationService } from "../../utils/global";
import { StatusTypes } from "../../utils/interfaces";
import dispatchOrderService from "./dispatchOrderService";
import rejectOrderService from "./rejectOrderService";

const acceptRejectOrderService = async (
	order_group_Id: string,
	userId: number,
	status,
	session: any,
	userService: UserService,
	reasonForRejectionId,
	userRejectionMessage
) => {
	const user = await checkUserById(userId, userService);
	const orderGroup = (await OrderGroup.findById(
		order_group_Id
	).populate("deliveryMerchant")) as IOrderGroup;

	if (!orderGroup) {
		throw new NotFoundError("Order not found");
	}

	const shop = await Shop.findOne({
		user: userId,
		status: StatusTypes.ACTIVE,
	}).populate("state");

	if (!shop) {
		throw new NotFoundError("Shop not found");
	}

	const shopId = shop._id;

	console.log(
		orderGroup.shop.toString(),
		shopId.toString()
	);

	if (orderGroup.shop.toString() !== shopId.toString()) {
		throw new NotFoundError(
			"You are not authorized to accept this order"
		);
	}

	if (orderGroup.status !== OrderStatus.PENDING) {
		throw new AuthorizationError(
			"You can only update the status of a pending order"
		);
	}

	// const cartItemId = orderGroup.cartItem;
	// const cartItem = await CartItem.findById(cartItemId);
	// const product = await Product.findById(cartItem.product);

	// if (!product) {
	//   throw new NotFoundError("Product not found");
	// }
	if (status === OrderStatus.ACCEPTED) {
		console.log(orderGroup.orderType);

		if (orderGroup.orderType === OrderType.DELIVERY) {
			await dispatchOrderService(
				orderGroup,
				shop,
				user,
				session
			);
		}
		const todaysDate = new Date();
		if (orderGroup.orderType === OrderType.SELF_PICKUP) {
			await OrderGroup.findOneAndUpdate(
				{ _id: orderGroup._id },
				{
					status: OrderStatus.ACCEPTED,
					deliveryStatus: OrderDeliveryStatus.PACKAGING,
					acceptedAt: todaysDate,
				},
				{ session }
			);
			let orders = orderGroup.orders;
			for (let order of orders) {
				await Order.findByIdAndUpdate(
					order,
					{
						status: OrderStatus.ACCEPTED,
						deliveryStatus: OrderDeliveryStatus.PACKAGING,
						acceptedAt: todaysDate,
					},
					{ session }
				);
			}
		}
		// console.log("hello fffffff");
	} else if (status === OrderStatus.REJECTED) {
		let rejectPayload;

		// Validate rejection reason
		if (reasonForRejectionId) {
			const validReason =
				await RejectedOrderReason.findById({
					_id: reasonForRejectionId,
				});

			if (!validReason) {
				throw new NotFoundError("Invalid rejection reason");
			}

			// Check if the reason is "Others" or matches the specific ID
			const isOthersOrSpecificId =
				validReason._id.toString() ===
					"66cfb2680d41dd34d2cf396d" ||
				validReason.name === "Others";

			// Construct the rejection payload
			rejectPayload = {
				reasonForRejection: validReason._id,
				...(isOthersOrSpecificId && {
					userOwnRejectionReason: userRejectionMessage,
				}),
			};
		} else {
			throw new ValidationError(
				"Rejection reason is required to reject an order"
			);
		}

		// console.log("hi there");
		await rejectOrderService(
			orderGroup,
			userId,
			session,
			rejectPayload
		);
	}

	// send notification to user
	if (status === OrderStatus.ACCEPTED) {
		await notificationService(
			"MotoPay",
			orderGroup.user,
			"Order",
			`Your order has been accepted`
		);
	} else if (status === OrderStatus.REJECTED) {
		await notificationService(
			"MotoPay",
			orderGroup.user,
			"Order",
			`Your order has been rejected`
		);
	}

	await session.commitTransaction();
	session.endSession();

	return true;
};

export default acceptRejectOrderService;
