import { NextFunction, Response } from "express";
import {
	AdminRequest,
	CustomRequest,
} from "../../utils/interfaces";
import { Product } from "../../model/shop/product";
import { successResponse } from "../../helpers";
import mongoose from "mongoose";
import {
	AdminCreateProductDealCatInput,
	ApproveProductInput,
	DeclineProductInput,
} from "../../validation/product.schema";
import { ProductStatus } from "../../types/shop";
import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from "../../errors";
import sendMailNodeMailer from "../../services/mail/sendEmailNodeMailer";
import {
	productRequestApprovedTemplate,
	productRequestDeniedTemplate,
} from "../../services/mail/templates";
import { AdminFlashSales } from "../../model/shop/adminFlashSalesProduct";
import {
	adminProductQuery,
	findProducts,
} from "../../services/product/productServices";
import { Category } from "../../model/admin/category";
import { SubCategory } from "../../model/admin/subCategory";
import { AdminPLCategoryModel } from "../../model/admin/adminProductDeals";
import { AdminProductSectionModel } from "../../model/admin/adminProductSection";

export const getProductsAdmin = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const adminId = req.adminUser._id;

		const productQueries = await adminProductQuery(
			req.query
		);

		const products = await findProducts(
			productQueries.query,
			productQueries.options
		);

		return res.send(
			successResponse(
				"Products retrieved successfully",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleProductAdmin = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { productID } = req.params;
		const product = await Product.findById(productID)
			.populate("productCategory")
			.populate("productShopCategory");
		return res.send(
			successResponse(
				"Product retrieved successfully",
				product
			)
		);
	} catch (error) {
		next(error);
	}
};

export const approveProduct = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	const { productId } =
		req.params as ApproveProductInput["params"];

	try {
		session.startTransaction();
		const product = await Product.findById(
			productId
		).populate("shop");

		if (!product) {
			throw new NotFoundError("Product not found");
		}
		console.log(product);

		const shop = product.shop;
		if (
			product.status === ProductStatus.VERIFIED ||
			product.status === ProductStatus.OUT_OF_STOCK ||
			product.status === ProductStatus.DELETED ||
			product.status === ProductStatus.DECLINED
		) {
			throw new ConflictError(
				"Product request already processed"
			);
		}
		product.status = ProductStatus.VERIFIED;

		console.log(product.status);

		await product.save({
			session,
		});

		//send mail to user about mail approval
		await sendMailNodeMailer(
			"Your product has been approved",
			//@ts-ignore
			shop.official_email,
			productRequestApprovedTemplate
		);

		await session.commitTransaction();
		session.endSession();
		return res.send(
			successResponse("Product approved successfully", null)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

export const declineProduct = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	const { productId } =
		req.params as DeclineProductInput["params"];
	const { description } =
		req.body as DeclineProductInput["body"];
	try {
		session.startTransaction();

		const product = await Product.findById(
			productId
		).populate("shop");

		if (!product) {
			throw new NotFoundError("Product not found");
		}
		const shop = product.shop;
		if (
			product.status === ProductStatus.VERIFIED ||
			product.status === ProductStatus.OUT_OF_STOCK ||
			product.status === ProductStatus.DELETED ||
			product.status === ProductStatus.DECLINED
		) {
			throw new ConflictError("Product already processed");
		}
		await sendMailNodeMailer(
			`Your product creation request for product with Id ${productId}, name ${product.productName} has been declined, reason: ${description}`,
			//@ts-ignore
			shop.official_email,
			productRequestDeniedTemplate
		);

		product.status = ProductStatus.DECLINED;
		await product.save({
			session,
		});
		await session.commitTransaction();
		session.endSession();
		return res.send(
			successResponse("Product declined successfully", null)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

// Allow Admin to create Product Listing Sections
export const createPLSectionAdmin = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;
		const sectionName = req.body.sectionName;
		// Ensure sectionName exist
		if (!sectionName)
			throw new ValidationError("sectionName is required");
		// Ensure sectionName is a string
		if (typeof sectionName !== "string") {
			throw new ValidationError(
				"sectionName must be a string"
			);
		}
		// check if the sectionName exist already
		const plSection =
			await AdminProductSectionModel.findOne({
				sectionName: sectionName,
			});
		if (plSection)
			throw new ValidationError(
				"Product listing section with the name already exist"
			);
		// Create the new product section
		const newProductSection = new AdminProductSectionModel({
			sectionName: sectionName,
		});
		// save product section
		await newProductSection.save();
		return res.send(
			successResponse(
				"New product listing section created successfully",
				newProductSection
			)
		);
	} catch (error) {
		next(error);
	}
};

// Update created Pl section
export const updatePLSection = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;
		const id = req.params.id;
		const sectionName = req.body.sectionName;
		// Ensure sectionName exist
		const plSection =
			await AdminProductSectionModel.findById(id);
		if (!plSection)
			throw new NotFoundError("plSection not found");

		// change the name
		plSection.sectionName = sectionName;
		// save the update
		await plSection.save();
		return res.send(
			successResponse(
				"Product listing section updated successfully",
				plSection
			)
		);
	} catch (error) {
		next(error);
	}
};

// delete created pl section
export const deletePLSection = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;
		// pl section id
		const id = req.params.id;
		// Ensure sectionName exist
		const plSection =
			await AdminProductSectionModel.findById(id);
		if (!plSection)
			throw new NotFoundError("plSection not found");
		// Find and update products
		await Product.updateMany(
			{ adminProductTags: plSection._id },
			{ $set: { adminProductTags: null } }
		);
		// Delete the section
		await AdminProductSectionModel.findByIdAndDelete(id);

		return res.send(
			successResponse(
				"Product listing section deleted successfully",
				plSection
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get all the admin Product listing sections
export const getAdminProductListingSections = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;
		// Retrieved all admin product listing sections
		const adminPLSections =
			await AdminProductSectionModel.find();
		return res.send(
			successResponse(
				"All admin product listing sections retrieved",
				adminPLSections
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get a single admin product listing section
export const getAdminProductListingSection = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;
		// get the id from params
		const id = req.params.id;
		// Retrieved a single admin product listing section
		const adminPLSection =
			await AdminProductSectionModel.findById(id);
		// validate it's exist
		if (!adminPLSection)
			throw new NotFoundError(
				"Product listing section not found"
			);
		return res.send(
			successResponse(
				"Product listing section retrieved",
				adminPLSection
			)
		);
	} catch (error) {
		next(error);
	}
};

// Add product to flash-sales category
export const addProductToAdminPLsection = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Confirm user as admin
		const adminId = req.adminUser._id;

		// Extract the product id and product listing id
		const { plSectionId, productId } = req.body;

		// Validate the product
		const product = await Product.findOne({
			_id: productId,
			status: ProductStatus.VERIFIED,
		})
			.populate({
				path: "tags",
				select: "tag",
			})
			.populate({
				path: "shop",
				select:
					"brand_name official_email shopLogoUrl state",
				populate: {
					path: "state",
					select: "name",
				},
			})
			.populate({
				path: "reviews",
				select: "user rating review",
			})
			.populate({
				path: "productImages.color",
				select: "_id name hexCode",
			})
			.populate({
				path: "adminProductTags",
				select: "_id sectionName",
			});

		if (!product)
			throw new NotFoundError("product not found");

		let msg;
		let plSection = null;

		// Validate product listing section existence if plSectionId is provided
		if (plSectionId) {
			plSection = await AdminProductSectionModel.findById(
				plSectionId
			);

			if (!plSection) {
				product.adminProductTags = null;
				msg = `Product removed from PPL category successfully`;
			} else {
				// Check if product has a discount
				if (product.discountRate <= 0) {
					throw new ValidationError(
						`Product must have a discount to be added to the ${plSection.sectionName} category`
					);
				}

				// Update the model
				product.adminProductTags = plSection._id;
				msg = `Product added to ${plSection.sectionName} successfully`;
			}
		} else {
			product.adminProductTags = null;
			msg = `Product removed from PPL category successfully`;
		}

		// Save the updated product
		await product.save();

		// Send the response
		res.send(successResponse(msg, product));
	} catch (error) {
		next(error);
	}
};


//  the below endpoints allow admin to create product listing section using category and sub-categories
export const createCategoryProductListingSection = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;
		// getting the payload from the req.body
		const { dealName, categoryId, subCategories } =
			req.body as AdminCreateProductDealCatInput["body"];

		// Check if the category exists
		const category = await Category.findById(categoryId);
		if (!category) {
			throw new NotFoundError("Category not found");
		}

		// Check if all subcategories exist
		for (const subCategoryItem of subCategories) {
			const { subCategoryId } = subCategoryItem;
			const subCategory = await SubCategory.findOne({
				_id: subCategoryId,
				categoryId: category._id,
			});

			if (!subCategory) {
				throw new NotFoundError(
					`Subcategory with ID ${subCategoryId} not found`
				);
			}
		}

		// create new product listing category
		const newProductDeal = new AdminPLCategoryModel({
			dealName,
			categoryId,
			subCategories,
		});
		await newProductDeal.save();

		return res.send(
			successResponse(
				"New product listing category created",
				newProductDeal
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get all admin product listing sections
export const getCategoryProductListingSections = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;

		// get all get all
		const allProductsSection =
			await AdminPLCategoryModel.find()
				.populate({
					path: "categoryId",
					select: "_id name",
				})
				.populate({
					path: "subCategories.subCategoryId",
					select: "_id name",
				});

		return res.send(
			successResponse(
				"All admin PL sections",
				allProductsSection
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getCategoryProductListingSection = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;
		// get the id
		const id = req.params.id;
		// get the product
		const productSection =
			await AdminPLCategoryModel.findOne({
				_id: id,
			})
				.populate({
					path: "categoryId",
					select: "_id name",
				})
				.populate({
					path: "subCategories.subCategoryId",
					select: "_id name",
				});
		// validate the product section
		if (!productSection)
			throw new NotFoundError("Product section not found");
		return res.send(
			successResponse(
				"Single Admin PL section",
				productSection
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteCategoryProductListingSection = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// confirm user as admin
		const adminId = req.adminUser._id;
		// getting the id
		const id = req.params.id;
		// check and validate plp section
		const adminProductSection =
			await AdminPLCategoryModel.findById(id);
		if (!adminProductSection)
			throw new NotFoundError("product section not found");
		// delete section
		await adminProductSection.deleteOne();
		return res.send(
			successResponse(
				"Admin product listing section deleted successfully",
				adminProductSection
			)
		);
	} catch (error) {
		next(error);
	}
};

export const updateCategoryProductListingSection = async (
	req: AdminRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Confirm user as admin
		const adminId = req.adminUser._id;

		// Extract the dealId from the request params
		const id = req.params.id;

		// Extract the optional fields from the request body
		const { dealName, categoryId, subCategories } =
			req.body as AdminCreateProductDealCatInput["body"];

		// Check if the deal exists
		const deal = await AdminPLCategoryModel.findById(id);
		if (!deal) {
			throw new NotFoundError("Deal not found");
		}

		// Check if the category exists, if categoryId is provided
		if (categoryId) {
			const category = await Category.findById(categoryId);
			if (!category) {
				throw new NotFoundError("Category not found");
			}
			deal.categoryId = category._id;
		}

		// Check if all subcategories exist, if subCategories are provided
		if (subCategories) {
			const validatedSubCategories = [];
			for (const subCategoryItem of subCategories) {
				const { subCategoryId } = subCategoryItem;
				const subCategory = await SubCategory.findOne({
					_id: subCategoryId,
					categoryId: categoryId,
				});
				if (!subCategory) {
					throw new NotFoundError(
						`Subcategory with ID ${subCategoryId} not found`
					);
				}
				validatedSubCategories.push({
					subCategoryId: subCategory._id,
					image: subCategoryItem.image,
				});
			}
			// Update the deal's subCategories with the validated ones
			deal.subCategories = validatedSubCategories;
		}

		// Update dealName if provided
		if (dealName) {
			deal.dealName = dealName;
		}

		// Save the updated deal
		await deal.save();

		return res.send(
			successResponse(
				"Product listing category updated",
				deal
			)
		);
	} catch (error) {
		next(error);
	}
};
