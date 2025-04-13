import {
	coerce,
	date,
	number,
	object,
	string,
	boolean,
	TypeOf,
	z,
	array,
} from "zod";
import { OrderType } from "../types/order";

const createBnplPayload = {
	body: object({
		loanAmount: number({
			required_error: "Loan amount is required",
			invalid_type_error: "Loan amount is number",
		}),
		orderPaymentGroupId: string({
			required_error: "Order payment group id is required",
			invalid_type_error:
				"Order payment group is must be a string",
		}),
		duration: number({
			required_error: "Duration is required",
			invalid_type_error:
				"Duration must be one of 1, 2, 3, 4, 5, or 6",
		}),
		frequency: string({
			required_error: "Frequency is required",
			invalid_type_error:
				"Frequency must be one of 'daily', 'weekly', or 'monthly'",
		}),
		signature: boolean({
			required_error: "User signature is required",
			invalid_type_error:
				"User signature must be a boolean",
		}),
	}),
};

export const CreateBNPLSchema = object({
	...createBnplPayload,
});

export type CreateBNPLInput = TypeOf<
	typeof CreateBNPLSchema
>;

const editBnplPayload = {
	body: object({
		loanAmount: number({
			required_error: "Loan amount is required",
			invalid_type_error: "Loan amount is number",
		}),
		duration: number({
			required_error: "Duration is required",
			invalid_type_error:
				"Duration must be one of 1, 2, 3, 4, 5, or 6",
		}),
		frequency: string({
			required_error: "Frequency is required",
			invalid_type_error:
				"Frequency must be one of 'daily', 'weekly', or 'monthly'",
		}),
		signature: boolean({
			required_error: "User signature is required",
			invalid_type_error:
				"User signature must be a boolean",
		}),
	}),
};

export const EditBNPLSchema = object({
	...editBnplPayload,
});

export type EditBNPLInput = TypeOf<typeof EditBNPLSchema>;

const payload = {
	body: object({
		// deliveryAddress: object({
		//   latitude: number({
		//     required_error: "latitude is required",
		//   }),
		//   longitude: number({
		//     required_error: "longitude is required",
		//   }),
		// }).optional(),
		orderType: z.enum([
			OrderType.DELIVERY,
			OrderType.SELF_PICKUP,
		]),
		// payOnDelivery: boolean().optional(),
		// buyNowPayLater: boolean().optional(),
		// payWithMotoPayWallet: boolean().optional(),
		pickUpDateTime: coerce.date().optional(),
		// deliveryAddressDescription: string({
		//   required_error:
		//     "Address Description is required, key: deliveryAddressDescription",
		// }).optional(),
		deliveryDetailsId: string({
			required_error:
				"Delivery details is required, key: deliveryDetailsId",
		}).optional(),
		// receiversName: string({
		//   required_error: "Receiver's name is required, key: receiversName",
		// }).optional(),
		// receiversPhoneNumber: string({
		//   required_error:
		//     "Receivers Phone Number is required, key: receiversPhoneNumber",
		// }).optional(),
		deliveryMerchant: string({
			required_error:
				"Delivery Merchant is required, key: deliveryMerchant",
		}).optional(),
		cartItemIds: array(
			string({
				invalid_type_error:
					"array item cartItemId must be a string",
			}),
			{
				required_error:
					"cartItemIds arrays field is required",
			}
		).min(1, {
			message: "Cart must contain at least one item",
		}),
		paymentType: z.enum(
			[
				"pay_by_wallet",
				"pay_on_delivery",
				"buy_now_pay_later",
			],
			{
				required_error: "Payment type is required",
			}
		),
	})
		.refine((data) => {
			//if order type is self pickup then deliveryDateTime is required
			if (data.orderType === OrderType.SELF_PICKUP) {
				return data.pickUpDateTime !== undefined;
			}
			return true;
		}, "Pick up date and time are required")
		.refine((data) => {
			if (data.orderType === OrderType.SELF_PICKUP) {
				const deliveryDate = new Date(data.pickUpDateTime);
				const today = new Date();
				return deliveryDate >= today;
			}
			return true;
		}, "Pick up date should not be in the past")
		.refine((data) => {
			//if order type is delivery then deliveryDetailsId is required
			if (data.orderType === OrderType.DELIVERY) {
				return data.deliveryDetailsId !== undefined;
			}
			return true;
		}, "Delivery details id is required")
		.refine((data) => {
			//if order type is delivery then deliveryDetailsId is required
			if (data.orderType === OrderType.DELIVERY) {
				return data.deliveryMerchant !== undefined;
			}
			return true;
		}, "Delivery merchant is required, key: deliveryMerchant"),
	// .refine((data) => {
	// 	// Only one of payWithMotoPayWallet, payOnDelivery, buyNowPayLater can be true
	// 	const paymentOptions = [
	// 		data.payWithMotoPayWallet,
	// 		data.payOnDelivery,
	// 		data.buyNowPayLater,
	// 	];
	// 	const selectedOptions = paymentOptions.filter(
	// 		(option) => option === true
	// 	);
	// 	return selectedOptions.length === 1;
	// }, "Only one payment option (payWithMotoPayWallet, payOnDelivery, buyNowPayLater) can be selected"),
	// .refine((data) => {
	//   //if order type is delivery then deliveryDetailsId is required
	//   if (data.orderType === OrderType.DELIVERY) {
	//     return data.receiversName !== undefined;
	//   }
	//   return true;
	// }, "Receiver's name is required, key: receiversName")
	// .refine((data) => {
	//   //if order type is delivery then deliveryDetailsId is required
	//   if (data.orderType === OrderType.DELIVERY) {
	//     return data.receiversPhoneNumber !== undefined;
	//   }
	//   return true;
	// }, "Receiver's phone number is required, key: receiversPhoneNumber")
	// .refine((data) => {
	//   //if order type is delivery then deliveryDetailsId is required
	//   if (data.orderType === OrderType.DELIVERY) {
	//     return data.deliveryAddress !== undefined;
	//   }
	//   return true;
	// }, "Delivery address is required, key: deliveryAddress")
	// .refine((data) => {
	//   //if order type is delivery then deliveryDetailsId is required
	//   if (data.orderType === OrderType.DELIVERY) {
	//     return data.deliveryAddressDescription !== undefined;
	//   }
	//   return true;
	// }, "Delivery address description is required, key: deliveryAddressDescription"),
};

export const InitiateOrderSchema = object({
	...payload,
});

export type InitiateOrderInput = TypeOf<
	typeof InitiateOrderSchema
>;

const completeOrderPayload = {
	body: object({
		order_payment_group: string({
			required_error:
				"Order group is required, key: order_group",
		}),
		pin: string({
			required_error: "Pin is required, key: pin",
		}),
	}),
};

export const completeOrderSchema = object({
	...completeOrderPayload,
});

export type CompleteOrderInput = TypeOf<
	typeof completeOrderSchema
>;

export const getOrdersByUserPayload = {
	query: object({
		status: z.enum([
			"all",
			"ongoing",
			"delivered",
			"returned",
			"disputed",
		]),
	}),
};

export const getOrdersByUserSchema = object({
	...getOrdersByUserPayload,
});

export type GetOrdersByUserInput = TypeOf<
	typeof getOrdersByUserSchema
>;

export const getOrdersByShopPayload = {
	query: object({
		status: z.enum([
			"pending",
			"accepted",
			"rejected",
			"cancelled",
			"delivered",
		]),
	}),
};

export const getOrdersByShopSchema = object({
	...getOrdersByShopPayload,
});

export type GetOrdersByShopInput = TypeOf<
	typeof getOrdersByShopSchema
>;

export const acceptOrRejectOrderPayload = {
	body: object({
		status: z.enum(["accepted", "rejected"], {
			required_error: "Status is required, key: status",
		}),
		reasonForRejectionId: string({
			invalid_type_error: "rejection must be a string",
		}).optional(),
		userRejectionMessage: string({
			invalid_type_error: "rejection must be a string",
		}).optional(),
	}),
	params: object({
		orderId: string({
			required_error: "Order Id is required, key: orderId",
		}),
	}),
};

export const acceptOrRejectOrderSchema = object({
	...acceptOrRejectOrderPayload,
});

export type AcceptOrRejectOrderInput = TypeOf<
	typeof acceptOrRejectOrderSchema
>;

const calculateDeliveryPayload = {
	body: object({
		userDeliveryAddressId: string({
			required_error: "User delivery address id required",
		}),
		cartItemIds: array(
			string({
				invalid_type_error:
					"array item cartItemId must be a string",
			}),
			{
				required_error:
					"cartItemIds arrays field is required",
			}
		).min(1, {
			message: "Cart must contain at least one item",
		}),
	}),
};

export const CalculateDeliverySchema = object({
	...calculateDeliveryPayload,
});

export type CalculateDeliveryInput = TypeOf<
	typeof CalculateDeliverySchema
>;

const updateOrderPayload = {
	body: object({
		returningCustomer: boolean().optional(),
	}),
};

export const updateOrderSchema = object({
	...updateOrderPayload,
});

export type updateOrderInput = TypeOf<
	typeof updateOrderSchema
>;
