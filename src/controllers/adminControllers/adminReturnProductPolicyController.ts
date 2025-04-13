import { NextFunction, Response } from "express";
import { AdminRequest } from "../../utils/interfaces";
import { ValidationError } from "../../errors";
import { ReturnProductPolicyModel } from "../../model/admin/returnProductPolicy";
import { successResponse } from "../../helpers";

export const createReturnProductPolicy = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const name = req.body.name;
		if (!name || typeof name !== "string") {
			throw new ValidationError(
				"Name is required and must be a string"
			);
		}
		const policy = new ReturnProductPolicyModel({
			name,
		});
		await policy.save();
		return res.send(
			successResponse(
				"return product policy created successfully",
				policy
			)
		);
	} catch (error) {
		next(error);
	}
};

export const updateReturnProductPolicy = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const id = req.params.id;
		const name = req.body.name;
		if (!name || typeof name !== "string") {
			throw new ValidationError(
				"Name is required and must be a string"
			);
		}
		const policy =
			await ReturnProductPolicyModel.findByIdAndUpdate(
				{
					_id: id,
				},
				{
					name: name,
				},
				{
					new: true,
				}
			);
		await policy.save();
		return res.send(
			successResponse(
				"return product policy updated successfully",
				policy
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteReturnProductPolicy = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const id = req.params.id;

		const deletedPolicy =
			await ReturnProductPolicyModel.findByIdAndDelete(id);

		return res.send(
			successResponse(
				"return product policy deleted successfully",
				deletedPolicy
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getReturnProductPolicies = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;

		const policies = await ReturnProductPolicyModel.find();

		return res.send(
			successResponse(
				"return product policies retrieve successfully",
				policies
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getReturnProductPolicy = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const id = req.params.id;

		const policy = await ReturnProductPolicyModel.findById(
			id
		);

		return res.send(
			successResponse(
				"return product policy retrieve successfully",
				policy
			)
		);
	} catch (error) {
		next(error);
	}
};
