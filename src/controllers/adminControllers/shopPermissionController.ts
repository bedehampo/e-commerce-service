import { NextFunction, Request, Response } from "express";
import {
	AdminRequest,
	CustomRequest,
	StatusTypes,
} from "../../utils/interfaces";
import { checkAdmin } from "../../services/checkAdmin";
import {
	NotFoundError,
	ValidationError,
} from "../../errors";
import { ShopPermission } from "../../model/shop/shopPermission";
import { successResponse } from "../../helpers";
import { checkUserById } from "../../middlewares/validators";
import { Shop } from "../../model/shop/shop";
import { ShopMember } from "../../model/shop/shopMembers";
import { AdminService } from "../../lib/adminService";
import { userNotificationInfo } from "../../utils/global";

// // admin endpoints
export const createShopPermission = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// extract admin id to check permission
		req.adminUser?._id;
		// await checkAdmin(currentUserId);
		let { permissionCode, permissionDescription } =
			req.body;
		permissionCode = permissionCode.toLowerCase();
		const doesPermissionExist =
			await ShopPermission.findOne({
				permissionCode: permissionCode,
			});
		if (doesPermissionExist)
			throw new ValidationError(
				"Permission already exists"
			);

		const newPermission = new ShopPermission({
			permissionCode,
			permissionDescription,
		});
		await newPermission.save();

		return res.send(
			successResponse(
				"Permission created successfully",
				newPermission
			)
		);
	} catch (error) {
		next(error);
	}
};

export const updateShopPermission = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser._id;
		// await checkAdmin(currentUserId);
		const { permissionId } = req.params;
		let { name } = req.body;
		name = name.toLowerCase();
		if (!name)
			throw new ValidationError("Input is required");
		const doesPermissionExist =
			await ShopPermission.findById(permissionId);
		if (!doesPermissionExist)
			throw new ValidationError(
				"Permission does not exist"
			);
		const updatedPermission =
			await ShopPermission.findByIdAndUpdate(
				permissionId,
				{ name },
				{ new: true }
			);
		return res.send(
			successResponse(
				"Permission updated successfully",
				updatedPermission
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteShopPermission = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser._id;
		// await checkAdmin(currentUserId);
		const { permissionId } = req.params;
		if (!permissionId)
			throw new ValidationError(
				"Permission ID is required"
			);
		const deleteShopPermission =
			await ShopPermission.findByIdAndDelete(permissionId);
		return res.send(
			successResponse(
				"Permission deleted successfully",
				deleteShopPermission
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getAllShopPermissionsAdmin = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser._id;
		// await checkAdmin(currentUserId);
		const permissions = await ShopPermission.find();
		return res.send(
			successResponse(
				"Permissions fetched successfully",
				permissions
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleShopPermissionAdmin = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser._id;
		// await checkAdmin(currentUserId);
		const { permissionId } = req.params;
		if (!permissionId)
			throw new ValidationError(
				"Permission ID is required"
			);
		const permission = await ShopPermission.findById(
			permissionId
		);
		if (!permission)
			throw new ValidationError(
				"Permission does not exist"
			);
		return res.send(
			successResponse(
				"Permission fetched successfully",
				permission
			)
		);
	} catch (error) {
		next(error);
	}
};

export const viewShopMembers = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// authenticated admin user
		const adminId = req.adminUser._id;
		// Extract shop id
		const shopId = req.params.id;
		if (!shopId)
			throw new NotFoundError("shop id is required");
		// Confirm that shop exist
		const shop = await Shop.findById(shopId);
		if (!shop) throw new NotFoundError("Shop not found");
		// Get shop members
		const shopMembers = await ShopMember.find({
			shopId: shopId,
		})
			.populate({
				path: "shopId",
				select: "brand_name description category",
				populate: {
					path: "category",
					select: "name -_id",
				},
			})
			.populate({
				path: "permissions",
				select: "permissionCode -_id",
			});

		// Extracting shop member name
		const updatedShopMembers = await Promise.all(
			shopMembers.map(async (shopMember) => {
				const user = await userNotificationInfo(
					shopMember.userId
				);
				if (user) {
					return {
						shopMember,
						firstName: user.firstName,
						lastName: user.lastName,
					};
				}
				return shopMember;
			})
		);

		return res.send(
			successResponse(
				"Shop members retrieved successfully",
				updatedShopMembers
			)
		);
	} catch (error) {
		next(error);
	}
};
