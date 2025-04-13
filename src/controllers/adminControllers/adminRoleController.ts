// import { NextFunction, Request, Response } from "express";
// import { AdminUser } from "../../model/admin/adminUser";
// import { AdminRole } from "../../model/admin/adminRole";
// import { CustomRequest } from "../../utils/interfaces";
// import { successResponse } from "../../helpers/index";
// import { ValidationError } from "../../errors";
// import { checkAdminUser } from "../../middlewares/validators";

// export const createRole = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);
// 		const { name, description } = req.body;

// 		if (!name || !description)
// 			throw new ValidationError("All fields are required");

// 		const lowerCaseName = name.toLowerCase();

// 		const adminRole = await AdminRole.create({
// 			name: lowerCaseName,
// 			description,
// 		});

// 		return res.send(
// 			successResponse("Admin Role created successfully", {
// 				adminRole,
// 			})
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const asignRole = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

// 		const { userId, roleId } = req.body;

// 		if (!userId || !roleId)
// 			throw new ValidationError(
// 				"User and Role are required"
// 			);

// 		const adminUser = await AdminUser.findOne({
// 			_id: userId,
// 			status: "verified",
// 		});
// 		const adminRole = await AdminRole.findById(roleId);

// 		if (!adminUser) {
// 			throw new Error("User not found");
// 		}
// 		if (!adminRole) {
// 			throw new Error("Role not found");
// 		}

// 		if (
// 			adminUser.adminRole &&
// 			adminUser.adminRole.toString() ===
// 				adminRole._id.toString()
// 		) {
// 			throw new Error("User already has this role");
// 		}

// 		// Assign the new role to the user
// 		adminUser.adminRole = adminRole._id;

// 		await adminUser.save();

// 		return res.send(
// 			successResponse("Role assign successfully", {
// 				adminUser,
// 			})
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const removeRole = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

// 		const { userId } = req.params;

// 		if (!userId) {
// 			throw new ValidationError("User ID is required");
// 		}

// 		const adminUser = await AdminUser.findOne({
// 			_id: userId,
// 			status: "verified",
// 		});

// 		if (!adminUser)
// 			throw new ValidationError("User not found");

// 		if (!adminUser.adminRole) {
// 			throw new Error(
// 				"User does not have CustomRequest roles to remove"
// 			);
// 		}

// 		adminUser.adminRole = null;

// 		await adminUser.save();

// 		return res.send(
// 			successResponse("Role removed successfully", {
// 				adminUser,
// 			})
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const reassignRole = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

// 		const { userId, newRoleId } = req.body;

// 		if (!userId || !newRoleId) {
// 			throw new ValidationError(
// 				"User ID and new Role ID are required"
// 			);
// 		}

// 		const role = await AdminRole.findById(newRoleId);
// 		if (!role) throw new ValidationError("Role not found");

// 		const adminUser = await AdminUser.findOne({
// 			_id: userId,
// 			status: "verified",
// 		});

// 		if (!adminUser)
// 			throw new ValidationError("User not found");

// 		const newAdminRole = await AdminRole.findById(
// 			newRoleId
// 		);

// 		if (!newAdminRole)
// 			throw new ValidationError("Role not found");

// 		if (
// 			!adminUser.adminRole ||
// 			adminUser.adminRole.toString() !==
// 				newAdminRole._id.toString()
// 		) {
// 			adminUser.adminRole = newAdminRole._id;
// 			await adminUser.save();

// 			return res.send(
// 				successResponse("Role reassigned successfully", {
// 					adminUser,
// 				})
// 			);
// 		} else {
// 			throw new Error("User already has this role");
// 		}
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const updateRole = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);
// 		const { name, description } = req.body;
// 		const { roleId } = req.params;
// 		const role = await AdminRole.findById(roleId);
// 		if (!role) throw new ValidationError("Role not found");

// 		const newRole = await AdminRole.findByIdAndUpdate(
// 			roleId,
// 			{
// 				name,
// 				description,
// 			},
// 			{ new: true }
// 		);
// 		await newRole.save();
// 		return res.send(
// 			successResponse("Role updated successfully", newRole)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const deleteRole = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);
// 		const { roleId } = req.params;
// 		const root = await AdminRole.findOne({
// 			_id: roleId,
// 			name: "root",
// 		});
// 		if (root)
// 			throw new ValidationError(
// 				"You cannot delete the root role"
// 			);
// 		const deletedRole = await AdminRole.findByIdAndDelete(
// 			roleId
// 		);
// 		await deletedRole.save();
// 		return res.send(
// 			successResponse(
// 				"Role deleted successfully",
// 				deletedRole
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const getAllRoles = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);
// 		const roles = await AdminRole.find();
// 		return res.send(
// 			successResponse("Roles fetched successfully", roles)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const getSingleRole = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);
// 		const { roleId } = req.params;
// 		const role = await AdminRole.findById(roleId);
// 		return res.send(
// 			successResponse("Roles fetched successfully", role)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };
