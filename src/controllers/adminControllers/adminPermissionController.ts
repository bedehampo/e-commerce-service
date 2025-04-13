// import { NextFunction, Request, Response } from "express";
// import { AdminUser } from "../../model/admin/adminUser";
// import { AdminPermission } from "../../model/admin/adminPermission";
// import { AdminRole } from "../../model/admin/adminRole";
// import { CustomRequest } from "../../utils/interfaces";
// import { successResponse } from "../../helpers/index";
// import { ValidationError } from "../../errors";
// import { checkAdminUser } from '../../middlewares/validators';

// export const createPermission = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);


// 		const { name } = req.body;

// 		if (!name)
// 			throw new ValidationError("All fields are required");

// 		const lowerCaseName = name.toLowerCase();

// 		const adminPermission = await AdminPermission.create({
// 			name: lowerCaseName,
// 		});

// 		return res.send(
// 			successResponse("Admin Role created successfully", {
// 				adminPermission,
// 			})
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const asignPermission = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);


// 		const { permissionId, roleId } = req.body;
// 		if (!permissionId || !roleId)
// 			throw new ValidationError(
// 				"Permission and Role are required"
// 			);
// 		const adminPermission = await AdminPermission.findById(
// 			permissionId
// 		);
// 		const adminRole = await AdminRole.findById(roleId);
// 		if (!adminPermission || !adminRole)
// 			throw new ValidationError(
// 				"Permission or Role not found"
// 			);

// 		// checking if role already has permission
// 		const hasPermission = adminRole.permissions.some(
// 			(p) => p.toString() === adminPermission._id.toString()
// 		);
// 		if (hasPermission) throw new ValidationError("Permission already assigned");
// 		// updating role permissions
// 		adminRole.permissions.push(adminPermission._id);
// 		await adminRole.save();
// 		return res.send(
// 			successResponse("Permission assigned", adminRole)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const removePermission = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);


// 		const { permissionId, roleId } = req.body;
// 		if (!permissionId || !roleId)
// 			throw new ValidationError(
// 				"Permission and Role are required"
// 			);
// 		const adminPermission = await AdminPermission.findById(
// 			permissionId
// 		);
// 		const adminRole = await AdminRole.findById(roleId);
// 		if (!adminPermission || !adminRole)
// 			throw new ValidationError(
// 				"Permission or Role not found"
// 			);
// 		// remove permission from role
// 		adminRole.permissions = adminRole.permissions.filter(
// 			(p) => p.toString() !== adminPermission._id.toString()
// 		);
// 		await adminRole.save();
// 		return res.send(
// 			successResponse("Permission removed", adminRole)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const updatePermission = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);


// 		const { permissionId } = req.params;
// 		const { name } = req.body;
// 		if (!permissionId || !name)
// 			throw new ValidationError(
// 				"Permission ID and name are required"
// 			);
// 		const adminPermission = await AdminPermission.findById(
// 			permissionId
// 		);
// 		if (!adminPermission)
// 			throw new ValidationError("Permission not found");
// 		adminPermission.name = name.toLowerCase();
// 		await adminPermission.save();
// 		return res.send(
// 			successResponse("Permission updated", adminPermission)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const deletePermission = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);

// 		const { permissionId } = req.params;
// 		if (!permissionId)
// 			throw new ValidationError(
// 				"Permission ID is required"
// 			);
// 		await AdminPermission.findByIdAndDelete(permissionId);

// 		return res.send(
// 			successResponse("Permission deleted", null)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const getAllPermissions = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);


// 		const permissions = await AdminPermission.find();
// 		return res.send(
// 			successResponse("Permissions fetched", permissions)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const getSinglePermission = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const adminId = req.adminUser && req.adminUser._id;
// 		await checkAdminUser(adminId);


// 		const { permissionId } = req.params;
// 		const permission = await AdminPermission.findById(
// 			permissionId
// 		);
// 		return res.send(
// 			successResponse("Permissions fetched", permission)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };
