import { NextFunction, Response } from "express";
import { CustomRequest } from "../utils/interfaces";
import { getUserIdAndUser } from "../services/product/productServices";
import {
	ReturnProductInput,
	UpdateReturnProductInput,
} from "../validation/product.schema";
import { Order } from "../model/shop/order";
import {
	OrderDeliveryStatus,
	OrderPaymentStatus,
	OrderStatus,
} from "../types/order";
import { NotFoundError, ValidationError } from "../errors";
import { ReturnProductPolicyModel } from "../model/admin/returnProductPolicy";
import { ReturnProductModel } from "../model/shop/returnProduct";
import { CartItem } from "../model/shop/cartItem";
import { successResponse } from "../helpers";
import { Shop } from "../model/shop/shop";
import {
	notificationService,
	userNotificationInfo,
} from "../utils/global";
import { Product } from '../model/shop/product';

export const returnAProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const {
			orderId,
			name,
			phoneNumber,
			pickUPChoice,
			address,
			reason,
		} = req.body as ReturnProductInput["body"];
		// validate the that the product was ordered
		const validatedOrder = await Order.findOne({
			_id: orderId,
			status: OrderStatus.DELIVERED,
			paymentStatus: OrderPaymentStatus.PAID,
			deliveryStatus: OrderDeliveryStatus.DELIVERED,
		});
		if (!validatedOrder)
			throw new NotFoundError("order not found");
		// extract product from cart
		const cart = await CartItem.findOne({
			_id: validatedOrder.cartItem,
		});
		if (!cart)
			throw new NotFoundError("cart item not found");
		// check if product has already being reported
		const exitedProduct = await ReturnProductModel.findOne({
			productId: cart.product,
		});
		if (exitedProduct)
			throw new ValidationError(
				"Product already submitted to be return"
			);
		// validate return policy
		const policy = await ReturnProductPolicyModel.findById(
			reason
		);
		if (!policy)
			throw new NotFoundError("return policy not found");

		const returnedProduct = new ReturnProductModel({
			userId: userId,
			orderId: validatedOrder._id,
			name: name,
			phoneNumber: phoneNumber,
			pickUPChoice: pickUPChoice,
			address: address,
			reason: policy.name,
			shop: validatedOrder.shop,
			productId: cart.product,
		});
		await returnedProduct.save();
		// Send a return product notification to the shop owner
		// Extract the product
		const product = await Product.findById(cart.product);
		// Extract shop owner details
		const shop = await Shop.findOne({
			_id: product.shop,
		});
		const shopOwner = await userNotificationInfo(shop.user);
		const subject = `Product Return Notification: ${product.productName}`;
		const message = `Dear ${shopOwner.firstName},\n\nWe hope this message finds you well. We would like to inform you that a return request has been initiated for one of your products, ${product.productName}.\n\nPlease review the return details and process the return as per your store's return policy.\n\nIf you have any questions or need further assistance, feel free to contact us.`;
		await notificationService(
			"MotoPay",
			shopOwner,
			subject,
			message
		);
		return res.send(
			successResponse(
				"return a product submitted successfully",
				returnedProduct
			)
		);
	} catch (error) {
		next(error);
	}
};

export const updateProductReport = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const id = req.params.id;
		let updateFields =
			req.body as UpdateReturnProductInput["body"];
		const productReport = await ReturnProductModel.findOne({
			_id: id,
			userId: userId,
			status: "pending",
		});
		if (!productReport)
			throw new NotFoundError("product report not found");
		if (updateFields.reason) {
			// validate return policy
			const policy =
				await ReturnProductPolicyModel.findById(
					updateFields.reason
				);
			if (!policy)
				throw new NotFoundError("return policy not found");
			updateFields.reason = policy.name;
		}
		// Update only the provided fields in the request body
		Object.assign(productReport, updateFields);
		// Save the updated product report
		await productReport.save();
		return res.send(
			successResponse(
				"returned product updated successfully",
				productReport
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteProductReport = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const id = req.params.id;

		const productReport = await ReturnProductModel.findOne({
			_id: id,
			userId: userId,
			status: { $in: ["pending", "resolved"] },
		});
		if (!productReport)
			throw new NotFoundError("Not found");
		productReport.status = "deleted";
		await productReport.save();
		return res.send(
			successResponse(
				"returned product deleted successfully",
				productReport
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getReturnProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const returnedProducts = await ReturnProductModel.find({
			userId: userId,
			status: { $ne: "deleted" },
		});
		return res.send(
			successResponse(
				"returned products retrieved successfully",
				returnedProducts
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getReturnProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const id = req.params.id;
		const returnedProduct =
			await ReturnProductModel.findOne({
				userId: userId,
				_id: id,
				status: { $ne: "deleted" },
			});
		if (!returnedProduct)
			throw new NotFoundError("returned product not found");
		return res.send(
			successResponse(
				"returned product retrieved successfully",
				returnedProduct
			)
		);
	} catch (error) {
		next(error);
	}
};
