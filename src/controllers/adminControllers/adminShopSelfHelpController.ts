import { NextFunction, Response } from "express";
import { AdminRequest } from "../../utils/interfaces";
import { NotFoundError } from "../../errors";
import { ShopSelfHelp } from "../../model/admin/shopSelfHelp";
import { successResponse } from "../../helpers";
import {
	EditSelfHelpInput,
	SelfHelpInput,
} from "../../validation/selfHelp.schema";

export const createSelfHelp = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser && req.adminUser._id;
		if (!adminId)
			throw new NotFoundError("admin not found");
		const { problem, solution } =
			req.body as SelfHelpInput["body"];
		const selfHelp = new ShopSelfHelp({
			problem,
			solution,
		});
		await selfHelp.save();
		return res.send(
			successResponse(
				"self help created successfully",
				selfHelp
			)
		);
	} catch (error) {
		next(error);
	}
};

export const editSelfHelp = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser && req.adminUser._id;
		if (!adminId)
			throw new NotFoundError("admin not found");
		const { id, problem, solution } =
			req.body as EditSelfHelpInput["body"];
		const updatedSelfHelp =
			await ShopSelfHelp.findByIdAndUpdate(
				id,
				{ problem, solution },
				{ new: true }
			);
		if (!updatedSelfHelp)
			throw new NotFoundError("self help not found");
		await updatedSelfHelp.save();
		return res.send(
			successResponse(
				"self help updated successfully",
				updatedSelfHelp
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteSelfHelp = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser && req.adminUser._id;
		if (!adminId)
			throw new NotFoundError("admin not found");
		const id = req.params.id;
		const selfHelp = await ShopSelfHelp.findById(id);
		if (!selfHelp)
			throw new NotFoundError("self help not found");
		await selfHelp.deleteOne();
		return res.send(
			successResponse(
				"self help deleted successfully",
				selfHelp
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getAllSelfHelpAdmin = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser && req.adminUser._id;
		if (!adminId)
			throw new NotFoundError("admin not found");
		const selfHelps = await ShopSelfHelp.find();
		return res.send(
			successResponse(
				"self help fetched successfully",
				selfHelps
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSelfHelpAdmin = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser && req.adminUser._id;
		if (!adminId)
			throw new NotFoundError("admin not found");
		const id = req.params.id;
		const selfHelp = await ShopSelfHelp.findById(id);
		if (!selfHelp)
			throw new NotFoundError("self help not found");
		return res.send(
			successResponse(
				"self help fetched successfully",
				selfHelp
			)
		);
	} catch (error) {
		next(error);
	}
};
