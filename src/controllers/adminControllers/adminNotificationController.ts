import { NextFunction, Response } from "express";
import { AdminRequest } from "../../utils/interfaces";
import { Shop } from "../../model/shop/shop";
import { sendShopsNotificationAdminInput } from "../../validation/shop.schema";
import {
	notificationService,
	userNotificationInfo,
} from "../../utils/global";
import { successResponse } from "../../helpers";

//Special Announcement to seller - Shop owners:
export const sendNotificationToShopOwners = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;
		// Optional parameters
		const { category, state, status } = req.query;
		// Mandatory parameters
		const { subject, message } =
			req.body as sendShopsNotificationAdminInput["body"];
		let query: any = {};
		// if category is provided
		if (category) {
			query.category = category;
		}
		// if state is provided
		if (state) {
			query.state = state;
		}

		// if status is provided
		if (status) {
			query.status = status;
		}

		const shops = await Shop.find(query);
		// Collect promises to process in parallel
		const notificationPromises = shops.map(async (shop) => {
			const user = await userNotificationInfo(shop.user);
			if (user) {
				await notificationService(
					"MotoPay",
					user,
					subject,
					message
				);
			}
		});

		// Execute all notification promises in parallel
		await Promise.all(notificationPromises);
		return res.send(
			successResponse(
				"Notification message sent to shop owner successfully",
				{
					subject: subject,
					message: message,
				}
			)
		);
	} catch (error) {
		next(error);
	}
};

// send Notification to a single shop owner
export const sendNotificationToShopOwner = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;
		// Getting the shop id
		const id = req.params.id;
		// Mandatory parameters
		const { subject, message } =
			req.body as sendShopsNotificationAdminInput["body"];

		const shop = await Shop.findById(id);
		// Get shop owner details
		const user = await userNotificationInfo(shop.user);
		// Send owner notification
		await notificationService(
			"MotoPay",
			user,
			subject,
			message
		);

		return res.send(
			successResponse(
				"Notification message sent to shop owner successfully",
				{
					subject: subject,
					message: message,
				}
			)
		);
	} catch (error) {
		next(error);
	}
};
