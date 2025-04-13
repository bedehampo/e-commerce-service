import { NextFunction, Response } from "express";
import { CustomRequest } from "../utils/interfaces";
import {
	getUserIdAndUser,
	handleResponse,
} from "../services/product/productServices";
import { ShopReportModel } from "../model/shop/report";
import { NotFoundError, ValidationError } from "../errors";
import { successResponse } from "../helpers";
import { CreateUserReportInput } from "../validation/report.schema";
import { Product } from "../model/shop/product";
import { UserReportModel } from "../model/shop/userReport";
import { Shop } from "../model/shop/shop";

export const getReportOptions = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		await getUserIdAndUser(req);
		const reportOptions = await ShopReportModel.find();
		return handleResponse(
			res,
			"Report options retrieved successfully",
			reportOptions
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleReportOption = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		await getUserIdAndUser(req);
		const id = req.params.id;
		const reportOption = await ShopReportModel.findById(id);
		if (!reportOption)
			throw new NotFoundError("Report option not found");
		return res.send(
			successResponse(
				"Report option retrieved successfully",
				reportOption
			)
		);
	} catch (error) {
		next(error);
	}
};

export const createReport = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		let {
			productId,
			complaint,
			complaintDescription,
			optionalDescription,
			reportType,
		} = req.body as CreateUserReportInput["body"];
		// validate the product
		const validatedProduct = await Product.findById(
			productId
		);
		if (!validatedProduct)
			throw new NotFoundError("Product not found");

		// validate the shop
		const shop = await Shop.findOne({
			user: userId,
		});
		if (shop) {
			const checkUserProduct = await Product.findOne({
				shop: shop._id,
				_id: productId,
			});
			if (checkUserProduct)
				throw new ValidationError(
					"You can't report your own product or shop"
				);
		}

		// validate the complaint
		const reportOption = await ShopReportModel.findById(
			complaint
		);
		if (!reportOption)
			throw new NotFoundError("Report option not found");
		// console.log(reportOption.reasons.length);
		// validate the complaint description
		if (
			reportOption.reasons &&
			reportOption.reasons.length == 0
		) {
			complaintDescription = complaintDescription;
		} else {
			const validDescription =
				reportOption.reasons.includes(complaintDescription);
			if (validDescription) {
				complaintDescription = complaintDescription;
			} else {
				throw new ValidationError(
					"Invalid complaint description"
				);
			}
		}
		const userReport = new UserReportModel({
			customerId: userId,
			shopId: validatedProduct.shop,
			productId: productId,
			complaint: complaint,
			complaintDescription: complaintDescription,
			optionalDescription:optionalDescription,
			reportType: reportType,
		});
		await userReport.save();
		return res.send(
			successResponse(
				`${reportType} report created successfully`,
				userReport
			)
		);
	} catch (error) {
		next(error);
	}
};


