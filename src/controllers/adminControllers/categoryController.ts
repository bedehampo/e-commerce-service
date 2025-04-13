import { NextFunction, Response } from "express";
import { successResponse } from "../../helpers";
import {
	AdminNewRequest,
	AdminRequest,
	CustomRequest,
} from "../../utils/interfaces";
import { CreateShopInput } from "../../validation/shop.schema";
import { Shop } from "../../model/shop/shop";
import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from "../../errors";
// import { CreateCategoryInput } from "../../validation/createCategory.schema";
import { Category } from "../../model/admin/category";
import { ShopList } from "../../model/shop/shoplist";
import { checkUserById } from "../../middlewares/validators";
import { SubCategory } from "../../model/admin/subCategory";
import { Variation } from "../../model/admin/variation";
import {
	CreateCategoryInput,
	CreateProductPropertyInput,
	EditCategoryInput,
} from "../../validation/createCategory.schema";
// import { checkAdminUser } from "../../middlewares/validators";
import mongoose, { Types } from "mongoose";
import { uploadBlobService } from "../../services/UploadService";
import { ProductPropertyModel } from "../../model/shop/productProperty";

// Admin controllers
// create category - admin
export const createCategory = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		req.user;
		// image upload service
		// if (!req.file)
		// 	return new NotFoundError("No files uploaded");
		let { categoryName, icon, image, subCategories } =
			req.body as CreateCategoryInput["body"];
		categoryName = categoryName.toLowerCase();
		// Check if the category already exists
		let doesCategoryExit = await Category.findOne({
			name: categoryName,
		});
		if (doesCategoryExit) {
			throw new ConflictError("Category already exists");
		}
		// create the category
		const category = new Category({
			name: categoryName,
			icon,
			image,
			subCategories: [],
		});

		// create and add the subcategories to category
		for (const subCategoryName of subCategories) {
			const subCategory = new SubCategory({
				categoryId: category._id,
				name: subCategoryName.toLowerCase(),
				variations: [],
			});
			await subCategory.save();
			category.subCategories.push(subCategory._id);
		}
		// const response = await uploadBlobService(req.file);
		// category.icon = response;
		await category.save({ session });
		await category.save();
		await session.commitTransaction();
		session.endSession();

		res.send(
			successResponse("Category created successfully", {
				category,
				subCategories,
			})
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

// edit an existing category controller - admin
export const editCategory = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		req.user;
		// Extract the category ID from the request params
		const categoryId = req.params.categoryId;
		const { categoryName, image, icon } =
			req.body as EditCategoryInput["body"];
		// Find the category with the ID provided
		const category = await Category.findOne({
			_id: categoryId,
		});

		// If no category found, return an error
		if (!category) {
			throw new Error("Category not found");
		}
		// Update the category data
		if (categoryName) {
			category.name = categoryName;
		}
		if (icon) {
			category.icon = icon;
		}
		if (image) {
			category.image = image;
		}
		// Save the updated category to the database
		await category.save({ session });
		await session.commitTransaction();
		session.endSession();

		// Return the updated category in the response
		return res.send(
			successResponse(
				"category updated successfully",
				category
			)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

// delete a category controller - admin
export const deleteCategory = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		// Extract the category ID from the request params
		const { categoryId } = req.params;
		// Find the category with the ID provided
		const category = await Category.findById(categoryId);
		if (!category) {
			throw new NotFoundError("Category not found");
		}
		// Find and delete all subcategories associated with the category
		await SubCategory.deleteMany({
			categoryId: category._id,
		});
		// Delete the category itself
		await Category.findByIdAndDelete(categoryId);
		// Return success response
		return res.send(
			successResponse(
				"Category and subcategories deleted successfully",
				null
			)
		);
	} catch (error) {
		next(error);
	}
};

// get categories controller and subcategories - admin
export const getCategoriesAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		// Find all categories and populate the 'subCategories' field with sub-category documents
		const categories = await Category.find().populate({
			path: "subCategories",
			select: "name",
			populate: {
				path: "variations",
				select: "name values",
			},
		});

		// Return success response
		return res.send(
			successResponse(
				"Categories fetched successfully",
				categories
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get a single category - admin
export const getCategoryAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		// getting the category id from the req.params
		const { categoryId } = req.params;
		// finding the category by id
		const category = await Category.findById(
			categoryId
		).populate({
			path: "subCategories",
			select: "name",
		});
		// checking if the category exist
		if (!category)
			throw new ValidationError("Category not found");
		// sending the response
		return res.send(
			successResponse(
				"Category fetched successfully",
				category
			)
		);
	} catch (error) {
		next(error);
	}
};

// create sub category - admin
export const createSubCategory = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const { categoryId, names } = req.body;
		if (!categoryId || !names) {
			throw new ValidationError(
				"Category and subCategories are required"
			);
		}
		// Check if the category exists
		const doesCategoryExist = await Category.findById(
			categoryId
		);
		if (!doesCategoryExist) {
			throw new ValidationError("Invalid category");
		}
		const createdSubCategories = [];
		// Loop through each sub-category name in names array
		for (const name of names) {
			if (!name) {
				throw new ValidationError(
					"Sub-category name is required"
				);
			}
			// Check if the sub-category already exists in the category
			const existingSubCategory = await SubCategory.findOne(
				{
					categoryId: categoryId,
					name: name.toLowerCase(),
				}
			);
			if (existingSubCategory) {
				throw new ConflictError(
					`Sub-category with name "${name}" already exists in the category`
				);
				break;
			}
			const newSubCategory = new SubCategory({
				categoryId,
				name: name.toLowerCase(),
			});
			await newSubCategory.save();
			createdSubCategories.push(newSubCategory._id);
			doesCategoryExist.subCategories.push(
				newSubCategory._id
			);
		}
		await doesCategoryExist.save();
		res.send(
			successResponse(
				"Subcategories created successfully",
				createdSubCategories
			)
		);
	} catch (error) {
		next(error);
	}
};

// edit sub category - admin
export const editSubCategory = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const { subCategoryId } = req.params;
		let { name } = req.body;
		let subCategoryExist = await SubCategory.findById(
			subCategoryId
		);
		if (!subCategoryExist)
			throw new ValidationError("Sub Category not found");
		name = name.toLowerCase();
		subCategoryExist.name = name;
		await subCategoryExist.save();
		res.send(
			successResponse(
				"Sub Category updated successfully",
				subCategoryExist
			)
		);
	} catch (error) {
		next(error);
	}
};

// get sub-categories - admin
export const getSubCategoriesAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const subCategories = await SubCategory.find();
		res.send(
			successResponse(
				"Sub Categories fetched successfully",
				subCategories
			)
		);
	} catch (e) {
		next(e);
	}
};

// get sub-categories - admin
export const getSubCategoryAdmin = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const subcategoryId = req.params.id;

		const subCategories = await SubCategory.findOne({
			_id: subcategoryId,
		}).populate({
			path: "variations",
			select: "name values _id",
		});
		res.send(
			successResponse(
				"Sub Categories fetched successfully",
				subCategories
			)
		);
	} catch (e) {
		next(e);
	}
};

// delete sub category -admin
export const deleteSubCategory = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const { subCategoryId } = req.params;

		// Find and remove the subcategory
		const subCategory = await SubCategory.findByIdAndRemove(
			subCategoryId,
			{
				lean: true,
			}
		);

		// Find the parent category by its ID
		const parentCategory = await Category.findOne({
			subCategories: subCategoryId,
		});

		if (parentCategory) {
			await parentCategory.updateOne({
				$pull: { subCategories: subCategoryId },
			});
		}

		res.send(
			successResponse(
				"Sub Category deleted successfully",
				subCategory
			)
		);
	} catch (e) {
		next(e);
	}
};

export const moveSubCategoryToCategory = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const {
			sourceCategoryId,
			destinationCategoryId,
			subCategoryId,
		} = req.body;

		if (
			!sourceCategoryId ||
			!destinationCategoryId ||
			!subCategoryId
		)
			throw new ValidationError(
				"Source category, destination category, and subcategory are required"
			);
		const sourceCategory = await Category.findOne({
			_id: sourceCategoryId,
		});
		if (!sourceCategory)
			throw new ValidationError(
				"Source category not found"
			);
		const destinationCategory = await Category.findOne({
			_id: destinationCategoryId,
		});
		if (!destinationCategory)
			throw new ValidationError(
				"Destination category not found"
			);
		const subCategory = await SubCategory.findOne({
			_id: subCategoryId,
		});
		if (!subCategory)
			throw new ValidationError("Sub category not found");

		// Remove the sub-category from the source category
		await sourceCategory.updateOne({
			$pull: { subCategories: subCategoryId },
		});

		// Add the sub-category to the destination category
		destinationCategory.subCategories.push(subCategory._id);
		// update the sub-category with the new category
		subCategory.categoryId = destinationCategory._id;
		await subCategory.save();
		await destinationCategory.save();

		res.send(
			successResponse(
				"Subcategory moved successfully",
				subCategory
			)
		);
	} catch (error) {
		next(error);
	}
};

// create variation - admin
export const createVariation = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const { variations } = req.body;
		if (
			!variations ||
			!Array.isArray(variations) ||
			variations.length === 0
		) {
			throw new ValidationError(
				"At least one variation is required"
			);
		}
		const createdVariations = [];
		for (const variationData of variations) {
			let { name, values } = variationData;
			name = name.toLowerCase();
			if (!name) {
				throw new ValidationError(
					"Variation name is required"
				);
			}
			let variation = await Variation.findOne({ name });
			if (variation) {
				console.warn(
					`Variation with name "${name}" already exists.`
				);
			} else {
				const lowerCaseName = name.toLowerCase();
				variation = new Variation({
					name: lowerCaseName,
					values: values || undefined,
				});
				await variation.save();
				createdVariations.push(variation);
			}
		}
		const responseVariations = createdVariations.map(
			(variation) => ({
				name: variation.name,
				values: variation.values,
			})
		);
		res.send(
			successResponse(
				"Variations created successfully",
				responseVariations
			)
		);
	} catch (error) {
		next(error);
	}
};

// Edit variations
export const editVariation = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	req.user;
	try {
		const { name } = req.body;
		const { variationId } = req.params;
		// Check if variationId is provided
		if (!variationId) {
			throw new ValidationError("Variation ID is required");
		}
		// Find the variation by its ID
		let variation = await Variation.findById(variationId);
		if (!variation) {
			throw new ValidationError("Variation not found");
		}
		// Update the variation name if provided
		if (name) {
			variation.name = name.toLowerCase();
		}
		// Save the updated variation
		await variation.save();
		res.send(
			successResponse(
				"Variation name updated successfully",
				variation
			)
		);
	} catch (error) {
		next(error);
	}
};

// add variation to sub categories
export const addVariationToSubCategory = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		// Extract the request body and subCategoryId
		const { subCategoryId, variationIds } = req.body;
		// Ensure variationIds is an array and not empty
		if (
			!Array.isArray(variationIds) ||
			variationIds.length === 0
		) {
			throw new ValidationError(
				"At least one variationId is required"
			);
		}

		// Check if the sub-category exists
		const checkSubCategoryExist = await SubCategory.findOne(
			{
				_id: subCategoryId,
			}
		);

		if (!checkSubCategoryExist) {
			throw new ValidationError("Invalid sub-category");
		}
		const existingVariations =
			checkSubCategoryExist.variations || [];
		// Iterate through each variationId
		for (const variationId of variationIds) {
			// Check if the variationId exists in the database
			const doesVariationExist = await Variation.findById(
				variationId
			);
			if (!doesVariationExist) {
				console.warn(
					`Variation with ID ${variationId} does not exist.`
				);
				continue;
			}
			// Check if the variation is already added to the sub-category
			if (!existingVariations.includes(variationId)) {
				// If not, add it to the sub-category
				existingVariations.push(variationId);
			}
		}
		// Update the variations array in the sub-category
		checkSubCategoryExist.variations = existingVariations;
		// Save the updated sub-category
		await checkSubCategoryExist.save();
		res.send(
			successResponse(
				"Variations added successfully",
				checkSubCategoryExist
			)
		);
	} catch (error) {
		next(error);
	}
};

// get variations - admin
export const getAllVariations = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const variations = await Variation.find({});
		res.send(
			successResponse(
				"Variations fetched successfully",
				variations
			)
		);
	} catch (error) {
		next(error);
	}
};

// get single variations - admin
export const getSingleVariation = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const { variationId } = req.params;
		const variation = await Variation.findById(variationId);
		res.send(
			successResponse(
				"Variation fetched successfully",
				variation
			)
		);
	} catch (error) {
		next(error);
	}
};

// delete variation - admin
export const deleteVariation = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const { variationId } = req.params;
		const variation = await Variation.findByIdAndRemove(
			variationId,
			{
				lean: true,
			}
		);
		// remove the variation from all sub-categories
		const subCategories = await SubCategory.find({
			variations: variationId,
		});
		for (const subCategory of subCategories) {
			await subCategory.updateOne({
				$pull: { variations: variationId },
			});
			await subCategory.save();
		}
		res.send(
			successResponse(
				"Variation deleted successfully",
				variation
			)
		);
	} catch (error) {
		next(error);
	}
};

// remove variation from subcategory - admin
export const removeVariationFromSubCategory = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		let { subCategoryId, variationId } = req.params;

		const subCategory = await SubCategory.findById(
			subCategoryId
		);
		const variation = await Variation.findById(variationId);

		if (!subCategory) {
			throw new ValidationError("Sub category not found");
		}

		if (!variation) {
			throw new ValidationError("Variation not found");
		}

		// Use updateOne with $pull to remove the variation from subCategory.variations
		await SubCategory.updateOne(
			{ _id: subCategoryId },
			{ $pull: { variations: variationId } }
		);

		// Reload the subCategory with the updated data
		const updatedSubCategory = await SubCategory.findById(
			subCategoryId
		);

		res.send(
			successResponse(
				"Variation removed successfully",
				updatedSubCategory
			)
		);
	} catch (error) {
		next(error);
	}
};

export const createProductProperties = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;

		const { properties, subCategoryIds } =
			req.body as CreateProductPropertyInput["body"];

		if (
			!Array.isArray(subCategoryIds) ||
			subCategoryIds.length === 0
		) {
			throw new ValidationError(
				"At least one subCategoryId is required"
			);
		}

		const subCats = await SubCategory.find({
			_id: { $in: subCategoryIds },
		});

		// Collect the IDs of the found sub-categories
		const foundSubCatIds = subCats.map((subCat) =>
			subCat._id.toString()
		);

		// Determine which IDs were not found
		const notFoundIds = subCategoryIds.filter(
			(id) => !foundSubCatIds.includes(id)
		);

		if (notFoundIds.length > 0) {
			throw new NotFoundError(
				`The following sub-category IDs were not found: ${notFoundIds.join(
					", "
				)}`
			);
		}

		const createdProperties = [];
		const existingProperties = [];

		// Loop through the properties
		for (const property of properties) {
			const lowercaseName = property.name.toLowerCase();
			const propertyValues = property.value || [];

			let productProperty =
				await ProductPropertyModel.findOne({
					name: lowercaseName,
				});

			if (productProperty) {
				// Update existing property with new values
				productProperty.values = Array.from(
					new Set([
						...productProperty.values,
						...propertyValues,
					])
				); // Merge existing values with new values
				await productProperty.save();
				existingProperties.push(productProperty);
			} else {
				// Create new property with values
				productProperty = await ProductPropertyModel.create(
					{
						name: lowercaseName,
						values: propertyValues,
					}
				);
				createdProperties.push(productProperty);
			}

			// Add the property to each sub-category if it's not already there
			for (const subCat of subCats) {
				if (
					!subCat.properties.includes(productProperty._id)
				) {
					subCat.properties.push(productProperty._id);
				}
			}
		}

		// Save all updated sub-categories
		await Promise.all(
			subCats.map((subCat) => subCat.save())
		);

		return res.send(
			successResponse(
				"Product properties processed successfully",
				{
					created: createdProperties,
					existing: existingProperties,
				}
			)
		);
	} catch (error) {
		next(error);
	}
};

export const createProductVariations = async (
	req: AdminNewRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user;
		const { variations, subCategoryIds } = req.body;

		if (
			!Array.isArray(subCategoryIds) ||
			subCategoryIds.length === 0
		) {
			throw new ValidationError(
				"At least one subCategoryId is required"
			);
		}

		if (
			!Array.isArray(variations) ||
			variations.length === 0
		) {
			throw new ValidationError(
				"At least one variation is required"
			);
		}

		const subCats = await SubCategory.find({
			_id: { $in: subCategoryIds },
		});
		if (subCats.length !== subCategoryIds.length) {
			throw new NotFoundError(
				"One or more sub-categories not found"
			);
		}

		const createdVariations = [];
		const existingVariations = [];

		// Loop through the variations
		for (const { name, values } of variations) {
			if (
				!name ||
				!Array.isArray(values) ||
				values.length === 0
			) {
				throw new ValidationError(
					`Invalid variation: ${JSON.stringify({
						name,
						values,
					})}`
				);
			}

			const lowercaseName = name.toLowerCase();
			let variation = await Variation.findOne({
				name: lowercaseName,
			});

			if (variation) {
				// Update existing variation with new values
				variation.values = Array.from(
					new Set([...variation.values, ...values])
				);
				await variation.save();
				existingVariations.push(variation);
			} else {
				// Create new variation
				variation = await Variation.create({
					name: lowercaseName,
					values: values,
				});
				createdVariations.push(variation);
			}

			// Add the variation to each sub-category if it's not already there
			for (const subCat of subCats) {
				if (!subCat.variations.includes(variation._id)) {
					subCat.variations.push(variation._id);
				}
			}
		}

		// Save all updated sub-categories
		await Promise.all(
			subCats.map((subCat) => subCat.save())
		);

		return res.send(
			successResponse(
				"Product variations processed successfully",
				{
					created: createdVariations,
					existing: existingVariations,
					subCategoryIds: subCats.map(
						(subCat) => subCat._id
					),
				}
			)
		);
	} catch (error) {
		next(error);
	}
};

// User controllers

// get categories controller - user
export const getCategories = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// get user id
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		// Find all categories
		const categories = await Category.find().select(
			"-__v -createdAt -updatedAt -subCategories"
		);

		console.log("Hello world - test");
		// Return success response
		return res.send(
			successResponse(
				"Category fetched successfully",
				categories
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getCategoriesAsGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Find all categories
		const categories = await Category.find().select(
			"-__v -createdAt -updatedAt -subCategories"
		);

		console.log("Hello world - test");
		// Return success response
		return res.send(
			successResponse(
				"Category fetched successfully - guest",
				categories
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get a single category - user
export const getCategory = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// getting user id from the req.user
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		// getting the category id from the req.params
		const { categoryId } = req.params;
		// finding the category by id
		const category = await Category.findById(
			categoryId
		).select("-__v -createdAt -updatedAt -subCategories");
		// checking if the category exist
		if (!category)
			throw new ValidationError("Category not found");
		// sending the response
		return res.send(
			successResponse(
				"Category fetched successfully",
				category
			)
		);
	} catch (error) {
		next(error);
	}
};

// get a single sub-category - user
export const getSingleSubCategory = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const { subCategoryId } = req.params;
		const subCategory = await SubCategory.findById(
			subCategoryId
		);
		res.send(
			successResponse(
				"Sub Category fetched successfully",
				subCategory
			)
		);
	} catch (error) {
		next(error);
	}
};

// get a single sub-category with their variations - user
export const getProductCategoryVariations = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// get user id
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const { subCategoryId } = req.params;
		const subCategory = await SubCategory.findById(
			subCategoryId
		)
			.populate({
				path: "variations",
				model: Variation, // Use the actual model name
				select: "_id name values",
			})
			.populate({
				path: "properties",
				select: "_id name values",
			});
		res.send(
			successResponse(
				"Sub Category fetched successfully",
				subCategory
			)
		);
	} catch (error) {
		next(error);
	}
};
