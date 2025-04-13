import { NextFunction, Response } from "express";
import { AdminRequest } from "../../utils/interfaces";
import {
	CreateShopReportInput,
	UpdateShopReportInput,
} from "../../validation/report.schema";

import { ShopReportModel } from "../../model/shop/report";
import { successResponse } from "../../helpers";
import { updateShop } from "../shopController";
import { NotFoundError } from "../../errors";


export const createShopReport = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const { complaint, reasons } =
			req.body as CreateShopReportInput["body"];
		const newReport = new ShopReportModel({
			complaint,
			reasons,
		});
		await newReport.save();
		return res.send(
			successResponse(
				"Shop Report created successfully",
				newReport
			)
		);
	} catch (error) {
		next(error);
	}
};

export const updateShopReport = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const reportId = req.params.id;
		const { complaint, reasons } =
			req.body as UpdateShopReportInput["body"];
		const report = await ShopReportModel.findById(reportId);
		if (!report)
			throw new NotFoundError("Report not found");
		report.complaint = complaint;
		report.reasons = reasons;
		await report.save();
		return res.send(
			successResponse(
				"Shop Report updated successfully",
				report
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteShopReport = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const reportId = req.params.id;
		const report = await ShopReportModel.findById(reportId);
		if (!report)
			throw new NotFoundError("Report not found");
		await ShopReportModel.findByIdAndDelete(report._id);
		return res.send(
			successResponse("Report deleted successfully", report)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopReports = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const reports = await ShopReportModel.find();
		return res.send(
			successResponse(
				"Shop Reports fetched successfully",
				reports
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleShopReport = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.adminUser._id;
		const reportId = req.params.id;
		const report = await ShopReportModel.findById(reportId);
		if (!report)
			throw new NotFoundError("Report not found");
		return res.send(
			successResponse(
				"Shop Report fetched successfully",
				report
			)
		);
	} catch (error) {
		next(error);
	}
};
