import { NextFunction, Response } from "express";
import { DisputeModel } from "../../model/shop/dispute";
import { successResponse } from "../../helpers";
import { AdminRequest } from "../../utils/interfaces";
import { NotFoundError } from "../../errors";
import { DisputeReasonModel } from "../../model/shop/shopDisputeReason";
import {
	DisputeReasonInput,
	EditDisputeReasonInput,
} from "../../validation/dispute.schema";

export const getDisputes = (
	req: any,
	res: Response,
	next: NextFunction
) => {
	try {
		const disputes = DisputeModel.find({});
		return res.send(
			successResponse("Disputes retrieved", disputes)
		);
	} catch (error) {
		next(error);
	}
};

export const getDisputesStats = (
	req: any,
	res: Response,
	next: NextFunction
) => {};

export const createDisputeReason = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const { name, duration } =
			req.body as DisputeReasonInput["body"];
		const disputeReason = new DisputeReasonModel({
			name,
			duration
		});
		await disputeReason.save();
		return res.send(
			successResponse(
				"Dispute reason created successfully",
				disputeReason
			)
		);
	} catch (error) {
		next(error);
	}
};

export const editDisputeReason = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const { id, name } =
			req.body as EditDisputeReasonInput["body"];
		const disputeReason = await DisputeReasonModel.findById(
			id
		);
		if (!disputeReason)
			throw new NotFoundError("Dispute reason not found");
		disputeReason.name = name;
		await disputeReason.save();
		return res.send(
			successResponse(
				"Dispute reason updated successfully",
				disputeReason
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteDisputeReason = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const id = req.params.id;
		const disputeReason = await DisputeReasonModel.findById(
			id
		);
		if (!disputeReason)
			throw new NotFoundError("Dispute reason not found");
		await DisputeReasonModel.findOneAndDelete(
			disputeReason._id
		);
		return res.send(
			successResponse(
				"Dispute reason deleted successfully",
				disputeReason
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getDisputeReasons = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const id = req.params.id;
		const disputeReason = await DisputeReasonModel.find();
		return res.send(
			successResponse(
				"Dispute reasons retrieved successfully",
				disputeReason
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleDisputeReason = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const id = req.params.id;
		const disputeReason = await DisputeReasonModel.findById(
			id
		);
		if (!disputeReason)
			throw new NotFoundError("Dispute reason not found");
		return res.send(
			successResponse(
				"Dispute reason retrieved successfully",
				disputeReason
			)
		);
	} catch (error) {
		next(error);
	}
};
