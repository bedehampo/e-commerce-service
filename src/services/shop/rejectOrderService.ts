import { NotFoundError } from "../../errors";
import { MainWallet } from "../../model/budgetWallets/MainWallets";
import { OrderGroup } from "../../model/shop/OrderGroup";
import { Order } from "../../model/shop/order";
import {
	IOrderGroup,
	OrderStatus,
} from "../../types/order";
import { IUser } from "../../types/user";
import { sendMessage } from "../sendMessage";

interface RejectPayload {
	reasonForRejection?: string;
	userOwnRejectionReason?: string;
}

const rejectOrderService = async (
	orderGroup: IOrderGroup,
	userId: number,
	session: any,
	rejectPayload: RejectPayload
) => {
	//refund money to user

	// const userMainWallet = await MainWallet.findOne({
	// 	userId: userId,
	// });

  // console.log("Hello world", userMainWallet);

	// if (!userMainWallet) {
	// 	throw new NotFoundError("User wallet not found My Guy");
	// }

	// const totalCost = orderGroup.totalAmount;

	// // // add to user wallet
	// userMainWallet.balance += totalCost;

	// await userMainWallet.save({
	// 	session,
	// });

	await OrderGroup.findByIdAndUpdate(
		orderGroup._id,
		{
			status: OrderStatus.REJECTED,
			reasonForRejection: rejectPayload,
		},
		{ session }
	);

	let orders = orderGroup.orders;

	for (let order of orders) {
		await Order.findByIdAndUpdate(
			order,
			{
				status: OrderStatus.REJECTED,
			},
			{ session }
		);
	}
};

export default rejectOrderService;
