import { NextFunction, Response } from "express";
import { AdminRequest } from "../../utils/interfaces";
import { PLPBannerInput } from "../../validation/product.schema";
import { Product } from "../../model/shop/product";
import { PLPBannerModel } from "../../model/admin/adminPLPBanner";
import { successResponse } from "../../helpers";
import {
	NotFoundError,
	ValidationError,
} from "../../errors";
import { ProductStatus } from "../../types/shop";

export const createPLPBanner = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Extract admin ID and banner details from request body
		const adminId = req.adminUser._id;
		const { banner, description, products } =
			req.body as PLPBannerInput["body"];

		// Check if all required parameters are present
		if (!banner || typeof banner !== "string")
			throw new NotFoundError(
				"Banner must be a non-empty string"
			);

		if (!description)
			throw new NotFoundError("description is required");

		if (!products || products.length === 0)
			throw new NotFoundError(
				"At least one product is required"
			);

		// Check for duplicate products
		const productSet = new Set(products);
		if (productSet.size !== products.length) {
			throw new ValidationError(
				"Duplicate products are not allowed"
			);
		}

		// Validate product IDs concurrently using Promise.all
		const validProductPromises = products.map(
			async (productId) => {
				try {
					const product = await Product.findOne({
						_id: productId,
						status: ProductStatus.VERIFIED,
					});
					if (!product) {
						throw new ValidationError(
							`Product not found or not verified: ${productId}`
						);
					}
					return product;
				} catch (error) {
					return error;
				}
			}
		);

		const validProducts = await Promise.all(
			validProductPromises
		);

		const newPlpBanner = new PLPBannerModel({
			banner,
			description,
			products: validProducts.map((product) => product._id),
		});
		await newPlpBanner.save();
		return res.send(
			successResponse(
				"New PLP banner created successfully",
				newPlpBanner
			)
		);
	} catch (error) {
		next(error);
	}
};

export const addProductToPLBanner = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser._id;
		const id = req.params.id;
		const { products } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			throw new ValidationError(
				"At least one product ID is required"
			);
		}

		const plpBanner = await PLPBannerModel.findById(id);
		if (!plpBanner) {
			throw new NotFoundError(
				"Product listing page banner not found"
			);
		}

		// Validate product IDs and check for duplicates in banner
		const validProductPromises = products.map(
			async (productId) => {
				const validProduct = await Product.findOne({
					_id: productId,
					status: ProductStatus.VERIFIED,
				});
				if (!validProduct) {
					throw new NotFoundError(
						`Product not found or not verified: ${productId}`
					);
				}
				if (plpBanner.products.includes(validProduct._id)) {
					throw new ValidationError(
						`Product ID ${productId} is already in the banner`
					);
				}
				return validProduct._id;
			}
		);

		const validProductIds = await Promise.all(
			validProductPromises
		);

		// Add valid product IDs to the banner
		plpBanner.products.push(...validProductIds);
		await plpBanner.save();

		return res.send(
			successResponse(
				"Products added successfully",
				plpBanner
			)
		);
	} catch (error) {
		next(error);
	}
};

export const removeProductFromPLBanner = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser._id;
		const id = req.params.id;
		const { products } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			throw new ValidationError(
				"At least one product ID is required"
			);
		}

		const plpBanner = await PLPBannerModel.findById(id);
		if (!plpBanner) {
			throw new NotFoundError(
				"Product listing page banner not found"
			);
		}

		// Ensure all products exist in the banner
		products.forEach((productId) => {
			if (!plpBanner.products.includes(productId)) {
				throw new NotFoundError(
					`Product ID ${productId} does not exist in the banner`
				);
			}
		});

		// Use Mongoose $pull operator to remove the products
		await PLPBannerModel.updateOne(
			{ _id: id },
			{ $pull: { products: { $in: products } } }
		);

		const updatedPlpBanner = await PLPBannerModel.findById(
			id
		);

		return res.send(
			successResponse(
				"Products removed successfully",
				updatedPlpBanner
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getAllPLBanners = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser._id;
		const plBanners = await PLPBannerModel.find();
		return res.send(
			successResponse(
				"All product listing banners fetched successfully",
				plBanners
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSinglePLBanner = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser._id;
		const id = req.params.id;
		const plBanner = await PLPBannerModel.findById(
			id
		).populate({
			path: "products",
		});

		console.log("The result", plBanner);
		if (!plBanner)
			throw new NotFoundError(
				"product listing banner not found"
			);
		return res.send(
			successResponse(
				"Single product listing banner fetch successfully",
				plBanner
			)
		);
	} catch (error) {
		next(error);
	}
};

export const editPLBanner = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const id = req.params.id;
		const { banner, description } = req.body;

		// Validate at least one field is being updated
		if (!banner && !description) {
			throw new NotFoundError(
				"At least one of banner or description must be provided for update"
			);
		}

		// update object based on provided fields
		const updateFields: any = {};
		if (banner !== undefined && banner !== "") {
			updateFields.banner = banner;
		}
		if (description !== undefined && description !== "") {
			updateFields.description = description;
		}

		// update directly in the database
		const updatedPLPBanner =
			await PLPBannerModel.findByIdAndUpdate(
				id,
				updateFields,
				{ new: true }
			);

		// Handle case where document was not found
		if (!updatedPLPBanner) {
			throw new NotFoundError(
				"Product listing banner not found"
			);
		}
		return res.send(
			successResponse(
				"Product listing banner edited successfully",
				updatedPLPBanner
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deletePLBanner = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser._id;
		const id = req.params.id;
		const plBanner = await PLPBannerModel.findByIdAndDelete(
			id
		);
		if (!plBanner)
			throw new NotFoundError(
				"product listing banner not found"
			);
		return res.send(
			successResponse(
				"Product listing banner deleted successfully",
				plBanner
			)
		);
	} catch (error) {
		next(error);
	}
};
