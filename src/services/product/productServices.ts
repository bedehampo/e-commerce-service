import mongoose, { Types } from "mongoose";
import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from "../../errors";
import { NextFunction, Response } from "express";
import { checkUserById } from "../../middlewares/validators";
import { SubCategory } from "../../model/admin/subCategory";
import { Variation } from "../../model/admin/variation";
import { Colour } from "../../model/color";
import { HashTag } from "../../model/shop/hashtag";
import { Product } from "../../model/shop/product";
import { Shop } from "../../model/shop/shop";
import { ShopAction } from "../../model/shop/shopActions";
import { calculateDiscountPercentage } from "../../utils/global";
import {
	CustomRequest,
	StatusTypes,
} from "../../utils/interfaces";
import {
	EditProductInput,
	NearByProductsInput,
	UploadProductInput,
} from "../../validation/product.schema";
import { ProductStatus } from "../../types/shop";
import { Order } from "../../model/shop/order";
import { OrderStatus } from "../../types/order";
import { Review } from "../../model/shop/Review";
import { State } from "../../model/shop/state";
import { differenceInDays } from "date-fns";
import { Category } from "../../model/admin/category";
import { WishList } from "../../model/shop/wishlist";
import { successResponse } from "../../helpers";
import { ProductsResponse } from "../../utils/productInterface";
import { AdminFlashSales } from "../../model/shop/adminFlashSalesProduct";
import { productsNearYou } from "../../controllers/productsController";
import { AdminProductSectionModel } from "../../model/admin/adminProductSection";
import { ProductPropertyModel } from "../../model/shop/productProperty";
// Clean utilities start

// Getting user id and details
export const getUserIdAndUser = async (req) => {
	const userId = req.user && req.user.id;
	const userService = req.userService;
	const user = await checkUserById(userId, userService);
	return { userId, user };
};

// Extract upload product data
export const extractProductData = (
	req: CustomRequest
): UploadProductInput["body"] => {
	const { body } = req;
	const {
		productImages,
		tags,
		variations,
		properties,
		...productData
	} = body as UploadProductInput["body"];

	return {
		...productData,
		productImages,
		tags,
		variations,
		properties,
	};
};

// Extract edit product data
export const extractProductDataEdit = (
	req: CustomRequest
): EditProductInput["body"] => {
	const { body } = req;
	const {
		productImages,
		tags,
		variations,
		properties,
		...productData
	} = body as EditProductInput["body"];

	return {
		...productData,
		productImages,
		tags,
		variations,
		properties,
	};
};
// Check if shop is active
export const findActiveShop = async (shopId: string) => {
	const shop = await Shop.findOne({
		_id: shopId,
	});

	if (!shop) {
		throw new NotFoundError("Shop not found");
	}

	if (shop.status !== StatusTypes.ACTIVE) {
		throw new NotFoundError("Inactive shop");
	}

	return shop;
};

export const findShopByUserId = async (userId: string) => {
	const shop = await Shop.findOne({ user: userId });
	return shop;
};

// Validate Product category
export const checkProductCategoryExistence = async (
	productCategory: string
) => {
	try {
		// Find the product category by its ID
		const doesProductCategoryExist =
			await SubCategory.findById(productCategory);

		if (!doesProductCategoryExist) {
			throw new NotFoundError(
				"Product category does not exist"
			);
		}
		return true;
	} catch (error) {
		throw error;
	}
};

// Validate product images
export const validateProductImages = async (
	productImages: any[]
) => {
	const usedColorIds = new Set();
	for (const image of productImages) {
		const colorId = image.color;
		const colorExists = await Colour.findById(colorId);
		if (!colorExists) {
			throw new Error(
				`Color ID '${colorId}' does not exist`
			);
		}
		if (usedColorIds.has(colorId)) {
			throw new Error(
				`Duplicate color ID '${colorId}' found in productImages`
			);
		}
		usedColorIds.add(colorId);
	}
};
// Validate variation
export const validateVariations = async (variations) => {
	try {
		const validatedVariations = [];

		// If variations are provided and the array is not empty, validate each variation
		if (variations && variations.length > 0) {
			for (const { name, values } of variations) {
				if (name) {
					await validateVariationName(name);
				}
				if (values) {
					await validateVariationValues(name, values);
				}
				validatedVariations.push({ name, values });
			}
		}

		return validatedVariations;
	} catch (error) {
		throw error;
	}
};

// Validate variation name
const validateVariationName = async (name) => {
	const existingVariation = await Variation.findOne({
		name: name.toLowerCase(),
	});
	if (!existingVariation) {
		throw new ValidationError(
			`Invalid variation name "${name}"`
		);
	}
};

// Validate variation values
const validateVariationValues = async (name, values) => {
	const existingVariation = await Variation.findOne({
		name: name.toLowerCase(),
	});
	if (
		!existingVariation.values ||
		existingVariation.values.length === 0
	) {
		return;
	}

	for (const value of values) {
		if (!existingVariation.values.includes(value)) {
			throw new ValidationError(
				`Invalid value "${value}" for variation "${name}"`
			);
		}
	}
};

// Helper function to capitalize the first letter of a string
function capitalize(str: string): string {
	if (typeof str !== "string" || str.length === 0)
		return str;
	return (
		str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
	);
}

const validatePropertyName = async (name) => {
	const existingProperty =
		await ProductPropertyModel.findOne({
			name: name.toLowerCase(),
		});
	if (!existingProperty) {
		throw new ValidationError(
			`Invalid property name "${name}"`
		);
	}
};

export const validateProperties = async (properties) => {
	try {
		const validatedProperties: Property[] = [];
		if (properties && properties.length > 0) {
			for (const { name, value } of properties) {
				if (name) {
					await validatePropertyName(name);
				}
				validatedProperties.push({
					name: capitalize(name),
					value: capitalize(value),
				});
			}
		}
		return validatedProperties;
	} catch (error) {
		throw error;
	}
};

// Check product existence
export const checkProductExistence = async (
	productName: string,
	shopId: string
) => {
	const doesProductExist = await Product.findOne({
		productName,
		shop: shopId,
		status: {
			$in: ["unverified", "verified", "out-of-stock"],
		},
	});
	if (doesProductExist) {
		throw new ValidationError("Product already exists");
	}
};

// Check product existence with _id
export const checkProductExistenceById = async (
	productId: string
) => {
	const doesProductExist = await Product.findOne({
		_id: productId,
		status: {
			$in: ["unverified", "verified", "out-of-stock"],
		},
	});
	if (doesProductExist) {
		return doesProductExist;
	} else {
		throw new ValidationError("Product not found");
	}
};

export const saveOrUpdateHashtags = async (
	tags: string[]
) => {
	const newHashtags = [];
	if (tags && tags.length > 0) {
		const normalizedHashtags = tags.map((tag) =>
			tag.trim().toLowerCase()
		);
		const existingHashtags = await HashTag.find({
			tag: { $in: normalizedHashtags },
		});
		for (const tag of normalizedHashtags) {
			const existingTag = existingHashtags.find(
				(hashtag) => hashtag.tag === tag
			);
			if (existingTag) {
				newHashtags.push(existingTag._id);
			} else {
				const newHashtag = new HashTag({ tag });
				const savedHashtag = await newHashtag.save();
				newHashtags.push(savedHashtag._id);
			}
		}
	}
	return newHashtags;
};

// Calculate product price
export const calculateProductPrice = (
	actualPrice: number,
	discountAmount: number
) => {
	let sales = false;
	let productPrice = actualPrice;
	if (
		discountAmount !== undefined &&
		discountAmount !== null &&
		discountAmount !== 0
	) {
		productPrice = actualPrice - discountAmount;
		sales = true;
	}
	return { productPrice, sales };
};

// save shop action
export const saveShopAction = async (
	userId: number,
	action: string,
	shopId: string
) => {
	const shopAction = new ShopAction({
		user: userId,
		action: action,
		shop: shopId,
	});
	await shopAction.save();
};

interface Property {
	name: string;
	value: string;
}

// Create product
export const createProduct = async (
	productData: any,
	newHashtags: any[],
	validatedVariations: any[],
	validateProperties: Property[],
	productPrice: number,
	sales: boolean,
	shopCategory: any,
	sku: string
) => {
	console.log(productData.productImages);
	const product = new Product({
		shop: productData.shopId,
		productImages: productData.productImages,
		productCategory: productData.productCategory,
		productDescription: productData.productDescription,
		keyFeature: productData.keyFeature,
		productName: productData.productName,
		actualPrice: productData.actualPrice,
		productPrice,
		sales,
		discountAmount: productData.discountAmount,
		stockQuantity: productData.productImages.reduce(
			(total: number, image: { quantity: number }) => {
				return total + (image.quantity || 0);
			},
			0
		),
		wholeSale: productData.wholeSale,
		tags: newHashtags,
		variations: validatedVariations,
		properties: validateProperties,
		customFields: productData.customFields,
		discountRate: calculateDiscountPercentage(
			productData.actualPrice,
			productData.discountAmount
		),
		productShopCategory: shopCategory,
		deliveryCoverage: productData.deliveryCoverage,
		sku: sku,
	});
	await product.save();
	return product;
};

// Update product
export const updateProduct = async (
	productData: any,
	newHashtags: any[],
	validatedVariations: any[],
	validatedProperties: Property[],
	productPrice: number,
	sales: boolean,
	shopCategory: any
) => {
	const product = await Product.findByIdAndUpdate(
		productData.productId,
		{
			productCategory: productData.productCategory,
			productName: productData.productName,
			productImages: productData.productImages,
			productDescription: productData.productDescription,
			productPrice,
			sales,
			discountAmount: productData.discountAmount,
			stockQuantity: productData.productImages.reduce(
				(total: number, image: { quantity: number }) => {
					return total + (image.quantity || 0);
				},
				0
			),
			wholeSale: productData.wholeSale,
			tags: newHashtags,
			customFields: productData.customFields,
			status: "unverified",
			discountRate: calculateDiscountPercentage(
				productData.actualPrice,
				productData.discountAmount
			),
			deliveryCoverage: productData.deliveryCoverage,
			actualPrice: productData.actualPrice,
			variations: validatedVariations,
			properties: validatedProperties,
			productShopCategory: shopCategory,
		},
		{ new: true }
	);
	await product.save();
	return product;
};

// Get Single products
export const findPopulatedProduct = async (
	id: string,
	shopId?: string
) => {
	const query: any = { _id: id, status: "verified" };

	if (shopId) {
		query.shop = shopId;
	}

	const product = await Product.findOne(query)
		.populate({
			path: "tags",
			select: "tag",
		})
		.populate({
			path: "shop",
			select: "brand_name official_email shopLogoUrl state",
		})
		.populate({
			path: "reviews",
			select: "user rating review",
		})
		.populate({
			path: "productImages.color",
			select: "_id name hexCode",
		});

	if (!product) {
		throw new NotFoundError("Product not found");
	}

	return product;
};

// Get my shop single product
export const singleProduct = async (
	id: string,
	shopId?: string
) => {
	const query: any = { _id: id };

	if (shopId) {
		query.shop = shopId;
	}

	const product = await Product.findOne(query)
		.populate({
			path: "tags",
			select: "tag",
		})
		.populate({
			path: "shop",
			select: "brand_name official_email shopLogoUrl state",
		})
		.populate({
			path: "productImages.color",
			select: "_id name hexCode",
		});

	if (!product) {
		throw new NotFoundError("Product not found");
	}

	return product;
};

// Process process for display
export const processProductForDisplay = async (
	product: any,
	userId: string
) => {
	let displayProduct;

	const shop = await findActiveShop(product.shop);
	if (
		shop &&
		product.shop.toString() === shop._id.toString()
	) {
		displayProduct = product;
	} else if (product.views.includes(userId)) {
		product.popularityScore += 1;
	} else {
		product.views.push(userId);
		product.popularityScore += 1;
	}
	await product.save();
	displayProduct = product;
	return displayProduct;
};

export const processProductForDisplayGuest = async (
	product: any
) => {
	let displayProduct;

	const shop = await findActiveShop(product.shop);
	if (
		shop &&
		product.shop.toString() === shop._id.toString()
	) {
		displayProduct = product;
	}
	await product.save();
	displayProduct = product;
	return displayProduct;
};

// Get all products
export const findProducts = async (query, options) => {
	const products = await Product.find(query)
		.populate({
			path: "tags",
			select: "tag",
		})
		.populate({
			path: "shop",
			select:
				"brand_name official_email shopLogoUrl state status",
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
		})
		.sort({ createdAt: -1 })
		.skip((options.page - 1) * options.limit)
		.limit(options.limit)
		.exec();
	// return products;

	// Step 2: Get the unique shop IDs from the products
	const shopIds = products.map(
		(product) => product.shop._id
	);
	const uniqueShopIds = [...new Set(shopIds)];

	// Step 3: Fetch the active shops using these shop IDs
	const activeShops = await Shop.find({
		_id: { $in: uniqueShopIds },
		status: StatusTypes.ACTIVE,
	})
		.select("_id")
		.exec();

	const activeShopIds = activeShops.map((shop) =>
		shop._id.toString()
	);

	// Step 4: Filter the products based on the active shops
	const activeProducts = products.filter((product) =>
		activeShopIds.includes(product.shop._id.toString())
	);

	return activeProducts;
};

// Get flash products
export const findFlashProducts = async (
	query: any,
	options
) => {
	let products = await Product.find(query)
		.populate({
			path: "tags",
			select: "tag",
		})
		.populate({
			path: "shop",
			select:
				"brand_name official_email shopLogoUrl state status",
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
		})
		.sort({ discountRate: -1 })
		.skip((options.page - 1) * options.limit)
		.limit(options.limit);

	// Calculate the number of days each product has existed
	products = products.map((product) => ({
		...product.toJSON(),
		daysSinceCreation: differenceInDays(
			new Date(),
			product.createdAt
		),
	}));
	// get admin product listing
	const adminPLSection =
		await AdminProductSectionModel.findOne({
			sectionName: "flash-sales",
		});
	if (!adminPLSection)
		throw new NotFoundError(
			"this Product listing section not found"
		);
	// Filter products to include only those with daysSinceCreation >= 60
	products = products.filter(
		(product) =>
			//@ts-ignore
			product.daysSinceCreation >= 30 ||
			product.adminProductTags == adminPLSection._id
	);

	// 	// Step 2: Get the unique shop IDs from the products
	const shopIds = products.map(
		(product) => product.shop._id
	);
	const uniqueShopIds = [...new Set(shopIds)];

	// 	// Step 3: Fetch the active shops using these shop IDs
	const activeShops = await Shop.find({
		_id: { $in: uniqueShopIds },
		status: StatusTypes.ACTIVE,
	})
		.select("_id")
		.exec();

	const activeShopIds = activeShops.map((shop) =>
		shop._id.toString()
	);

	// 	// Step 4: Filter the products based on the active shops
	const activeProducts = products.filter((product) =>
		activeShopIds.includes(product.shop._id.toString())
	);
	return activeProducts;
};

// Get top selling products
export const topSellingProducts = async (
	query: any,
	options
) => {
	let products = await Product.find(query)
		.populate({
			path: "tags",
			select: "tag",
		})
		.populate({
			path: "shop",
			select:
				"brand_name official_email shopLogoUrl state status",
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
		})
		.sort({ quantitySold: -1 })
		.skip((options.page - 1) * options.limit)
		.limit(options.limit);

	// Calculate the number of days each product has existed
	products = products.map((product) => ({
		...product.toJSON(),
		daysSinceCreation: differenceInDays(
			new Date(),
			product.createdAt
		),
	}));
	// get admin product listing
	const adminPLSection =
		await AdminProductSectionModel.findOne({
			sectionName: "flash-sales",
		});
	if (!adminPLSection)
		throw new NotFoundError(
			"this Product listing section not found"
		);
	// Filter products to include only those with daysSinceCreation >= 60
	products = products.filter(
		(product) =>
			//@ts-ignore
			product.daysSinceCreation >= 30 ||
			product.adminProductTags == adminPLSection._id
	);

	// 	// Step 2: Get the unique shop IDs from the products
	const shopIds = products.map(
		(product) => product.shop._id
	);
	const uniqueShopIds = [...new Set(shopIds)];

	// 	// Step 3: Fetch the active shops using these shop IDs
	const activeShops = await Shop.find({
		_id: { $in: uniqueShopIds },
		status: StatusTypes.ACTIVE,
	})
		.select("_id")
		.exec();

	const activeShopIds = activeShops.map((shop) =>
		shop._id.toString()
	);

	// 	// Step 4: Filter the products based on the active shops
	const activeProducts = products.filter((product) =>
		activeShopIds.includes(product.shop._id.toString())
	);
	return activeProducts;
};

// Get single product with populated properties
export const findProduct = async (query: any) => {
	const product = await Product.findById(query);
	if (!product)
		throw new NotFoundError("Product not found");
	return product;
};

// get shop verified product
export const findShopVerifiedProducts = async (
	shop: any,
	options
) => {
	const products = await Product.find({
		shop: shop._id,
		status: "verified",
	})
		.populate({
			path: "tags",
			select: "tag",
		})
		.populate({
			path: "shop",
			select:
				"brand_name official_email shopLogoUrl state status",
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
		})
		.sort({ createdAt: -1 })
		.skip((options.page - 1) * options.limit)
		.limit(options.limit)
		.exec();
	return products;
};

// Get Order
export const findOrder = async (
	userId: number,
	productId: string
) => {
	const order = await Order.aggregate([
		{
			$match: {
				user: userId,
				status: OrderStatus.DELIVERED,
			},
		},
		{
			$lookup: {
				from: "cart_items",
				localField: "cartItem",
				foreignField: "_id",
				as: "cartItem",
			},
		},
		{
			$unwind: "$cartItem",
		},
		{
			$match: {
				"cartItem.product": new mongoose.Types.ObjectId(
					productId
				),
			},
		},
	]);

	if (order.length === 0) {
		throw new NotFoundError(
			"You are not a verified purchaser of this product"
		);
	}
	return order;
};

// Check Out of stock product
export const checkOutOfStockProduct = async (
	query: string
) => {
	const product = await Product.findOne({
		_id: query,
		status: {
			$in: [
				ProductStatus.VERIFIED,
				ProductStatus.OUT_OF_STOCK,
			],
		},
	});

	if (!product)
		throw new NotFoundError("product not found");
	return product;
};

// Handle response
export const handleResponse = (
	res: Response,
	message: string,
	data: any[]
) => {
	return res.send(successResponse(message, data));
};

// Extract product wholesales
export const extractProductWholesale = async (
	id: string,
	product
) => {
	const wholesale = product.wholeSale.find(
		(w) => w._id.toString() === id
	);
	if (!wholesale) {
		throw new NotFoundError("Wholesale not found");
	}
	product.wholeSale.pull({
		_id: id,
	});
	product.status = ProductStatus.UNVERIFIED;
	await product.save();
};

// Product review
export const findProductReview = async (
	userId: number,
	productId: string,
	rating: number,
	review: string,
	session
) => {
	const reviewExists = await Review.findOne({
		user: userId,
		product: new mongoose.Types.ObjectId(productId),
	});
	if (reviewExists) {
		throw new ConflictError(
			"You have already reviewed this product"
		);
	}
	const newReview = await new Review({
		user: userId,
		product: new mongoose.Types.ObjectId(productId),
		rating,
		review,
	});
	await newReview.save({ session });
	return newReview;
};

// get product categories
export const fetchProductCategories = async (
	query: string
) => {
	const categoryId = new mongoose.Types.ObjectId(query);
	const result = await SubCategory.find({
		categoryId: categoryId,
	}).select(
		"-updatedAt -createdAt -__v -variations -categoryId -properties"
	);
	return result;
};

// Get products for shop - start

export const fetchNearbyShops = async (pipeline: any[]) => {
	return await Shop.aggregate(pipeline).allowDiskUse(true);
};

export const fetchProductsForShops = async (
	query,
	pipeline
) => {
	// Extract pagination parameters
	const page = parseInt(query.page, 10) || 1;
	const limit = parseInt(query.limit, 10) || 10;
	const skip = (page - 1) * limit;

	// Fetch nearby shops using the pipeline
	const nearbyShops = await fetchNearbyShops(pipeline);

	// Fetch products for all nearby shops
	const allProducts = await Product.find({
		shop: { $in: nearbyShops.map((shop) => shop._id) },
		status: { $ne: ProductStatus.DELETED },
	})
		.populate({
			path: "tags",
			select: "tag",
		})
		.populate({
			path: "shop",
			select: "brand_name official_email shopLogoUrl state",
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
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit)
		.exec();

	return allProducts;
};

export const buildFilterConditions = async (
	userId: string
) => {
	const doesUserHaveShop = await Shop.findOne({
		user: userId,
	});
	const ands = [];
	if (doesUserHaveShop) {
		ands.push({
			_id: {
				$ne: new mongoose.Types.ObjectId(
					doesUserHaveShop._id
				),
			},
		});
	}
	return ands;
};

// Guest

export const buildPipeline = async (
	location: any,
	filterConditions: any[],
	userId: string
) => {
	let pipeline = [];
	if (location) {
		pipeline.push({
			$geoNear: {
				near: {
					type: "Point",
					coordinates: [
						location.longitude,
						location.latitude,
					],
				},
				maxDistance: 30000,
				spherical: true,
				distanceField: "dist.calculated",
				includeLocs: "dist.location",
			},
		});
	}

	if (filterConditions.length > 0) {
		const match = { $and: filterConditions };
		pipeline.push({ $match: match });
	}

	pipeline.push({
		$match: {
			$and: [
				{
					user: {
						$ne: new mongoose.Types.ObjectId(userId),
					},
				},
				{ status: StatusTypes.ACTIVE },
				// { status: { $ne: StatusTypes.DELETED } },
			],
		},
	});
	return pipeline;
};

export const buildPipelineGuest = async (location: any) => {
	let pipeline = [];
	if (location) {
		pipeline.push({
			$geoNear: {
				near: {
					type: "Point",
					coordinates: [
						location.longitude,
						location.latitude,
					],
				},
				maxDistance: 30000,
				spherical: true,
				distanceField: "dist.calculated",
				includeLocs: "dist.location",
			},
		});
	}

	pipeline.push({
		$match: {
			$and: [{ status: StatusTypes.ACTIVE }],
		},
	});
	return pipeline;
};

// Get products for shop - end

// shop products query
export const myProductQuery = async (
	query: string,
	search: string,
	subcategory: string,
	shopId: string,
	options: { page: number; limit: number }
) => {
	let filter: any = {
		shop: shopId,
		status: { $ne: "deleted" },
	};

	// // Adjust filter based on the query status
	if (
		query === "unverified" ||
		query === "verified" ||
		query === "out-of-stock"
	) {
		filter.status = query;
	}

	// // Add search conditions if search query is provided
	if (search) {
		filter.$or = [
			{ productName: new RegExp(search, "i") },
			{ productDescription: new RegExp(search, "i") },
			{ sku: new RegExp(search, "i") },
		];
	}

	// // Add category filter if provided
	if (subcategory) {
		filter.productCategory = subcategory;
	}

	// // filter by sku
	// if (sku) {
	// 	filter.sku = sku;
	// }

	const products = await Product.find(filter)
		.populate({
			path: "tags",
			select: "tag",
		})
		.populate({
			path: "shop",
			select: "brand_name official_email shopLogoUrl state",
		})
		.populate({
			path: "shop.state",
			select: "name",
		})
		.sort({ createdAt: -1 })
		.skip((options.page - 1) * options.limit)
		.limit(options.limit)
		.exec();

	return products;
};

// admin product query
export const adminProductQuery = async (query: any) => {
	let productsQuery: any = {};

	// getting the query parameters
	const search = query.search as string | undefined;
	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;
	const productCategory = query.productCategory as
		| string
		| undefined;
	const minDiscountRate = query.minDiscountRate
		? Number(query.minDiscountRate)
		: undefined;
	const maxDiscountRate = query.maxDiscountRate
		? Number(query.maxDiscountRate)
		: undefined;
	const minProductPrice = query.minProductPrice
		? Number(query.minProductPrice)
		: undefined;
	const maxProductPrice = query.maxProductPrice
		? Number(query.maxProductPrice)
		: undefined;
	const minStockQuantity = query.minStockQuantity
		? Number(query.minStockQuantity)
		: undefined;
	const maxStockQuantity = query.maxStockQuantity
		? Number(query.maxStockQuantity)
		: undefined;
	const minQuantitySold = query.minQuantitySold
		? Number(query.minQuantitySold)
		: undefined;
	const maxQuantitySold = query.maxQuantitySold
		? Number(query.maxQuantitySold)
		: undefined;
	const status = query.status as string | undefined;
	const deliveryCoverage = query.deliveryCoverage as
		| string
		| undefined;
	const fromDateStr = query.fromDate as string | undefined;
	const toDateStr = query.toDate as string | undefined;

	// parse date to
	let fromDate: Date | undefined;
	let toDate: Date | undefined;

	if (fromDateStr) {
		fromDate = new Date(fromDateStr);
	}

	if (toDateStr) {
		toDate = new Date(toDateStr);
	}
	if (fromDate && toDate) {
		productsQuery.createdAt = {
			$gte: fromDate,
			$lte: toDate,
		};
	} else if (fromDate) {
		productsQuery.createdAt = { $gte: fromDate };
	} else if (toDate) {
		productsQuery.createdAt = { $lte: toDate };
	}

	// search with productName or productDescription
	if (search) {
		productsQuery.$or = [
			{
				productName: {
					$regex: new RegExp(search, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(search, "i"),
				},
			},
		];
	}
	// query product by product category
	if (productCategory) {
		productsQuery.productCategory =
			new mongoose.Types.ObjectId(productCategory);
	}
	// query products by discountRate
	if (
		minDiscountRate !== undefined &&
		maxDiscountRate !== undefined
	) {
		productsQuery.discountRate = {
			$gte: minDiscountRate,
			$lte: maxDiscountRate,
		};
	} else if (minDiscountRate !== undefined) {
		productsQuery.discountRate = { $gte: minDiscountRate };
	} else if (maxDiscountRate !== undefined) {
		productsQuery.discountRate = { $lte: maxDiscountRate };
	}
	// query products with product price
	if (
		minProductPrice !== undefined &&
		maxProductPrice !== undefined
	) {
		productsQuery.productPrice = {
			$gte: minProductPrice,
			$lte: maxProductPrice,
		};
	} else if (minProductPrice !== undefined) {
		productsQuery.productPrice = { $gte: minProductPrice };
	} else if (maxProductPrice !== undefined) {
		productsQuery.productPrice = { $lte: maxProductPrice };
	}
	// query products by stock quantity
	if (
		minStockQuantity !== undefined &&
		maxStockQuantity !== undefined
	) {
		productsQuery.stockQuantity = {
			$gte: minStockQuantity,
			$lte: maxStockQuantity,
		};
	} else if (minStockQuantity !== undefined) {
		productsQuery.stockQuantity = {
			$gte: minStockQuantity,
		};
	} else if (maxStockQuantity !== undefined) {
		productsQuery.stockQuantity = {
			$lte: maxStockQuantity,
		};
	}
	// query products with quantity sold
	if (
		minQuantitySold !== undefined &&
		maxQuantitySold !== undefined
	) {
		productsQuery.quantitySold = {
			$gte: minQuantitySold,
			$lte: maxQuantitySold,
		};
	} else if (minQuantitySold !== undefined) {
		productsQuery.quantitySold = {
			$gte: minQuantitySold,
		};
	} else if (maxQuantitySold !== undefined) {
		productsQuery.quantitySold = {
			$lte: maxQuantitySold,
		};
	}
	// query products with status
	if (status) {
		productsQuery.status = status;
	}
	// query products by deliveryCoverage
	if (deliveryCoverage) {
		productsQuery.deliveryCoverage = deliveryCoverage;
	}
	// return productsQuery;
	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

// Clean product build query
// common build query
const buildCommonQuery = async (query: any, shop: any) => {
	let productsQuery: any = { status: "verified" };

	let orConditions: any[] = [];

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;
	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;

	if (searchQuery) {
		orConditions.push(
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			}
		);
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (shop) {
		productsQuery.shop = { $ne: shop._id };
	}

	if (stateQuery) {
		const state = await State.findOne({ _id: stateQuery });
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});
			const userShopId = shop ? shop._id : null;
			const otherShopsInState = shopsInState.filter(
				(shop) => String(shop._id) !== String(userShopId)
			);
			if (lgaQuery) {
				const shopsInLGA = otherShopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				orConditions.push({ shop: { $in: shopIds } });
			} else {
				const shopIds = otherShopsInState.map(
					(shop) => shop._id
				);
				orConditions.push({ shop: { $in: shopIds } });
			}
		}
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			orConditions.push({ shop: { $in: shopIds } });
		}
	}

	if (orConditions.length > 0) {
		productsQuery.$or = orConditions;
	}

	return productsQuery;
};

// common query - guest
const buildCommonQueryGuest = async (query: any) => {
	let productsQuery: any = { status: "verified" };

	let orConditions: any[] = [];

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;
	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;

	if (searchQuery) {
		orConditions.push(
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			}
		);
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (stateQuery) {
		const state = await State.findOne({ _id: stateQuery });
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});

			if (lgaQuery) {
				const shopsInLGA = shopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				orConditions.push({ shop: { $in: shopIds } });
			} else {
				const shopIds = shopsInState.map(
					(shop) => shop._id
				);
				orConditions.push({ shop: { $in: shopIds } });
			}
		}
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			orConditions.push({ shop: { $in: shopIds } });
		}
	}

	if (orConditions.length > 0) {
		productsQuery.$or = orConditions;
	}

	return productsQuery;
};

// Top selling products queries
const topSellingBuildCommonQuery = async (
	query: any,
	shop: any
) => {
	let productsQuery: any = {
		status: "verified",
		stockQuantity: { $gt: 0 },
		quantitySold: { $gt: 0 },
	};

	let orConditions: any[] = [];

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;
	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;

	if (searchQuery) {
		orConditions.push(
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			}
		);
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (shop) {
		productsQuery.shop = { $ne: shop._id };
	}

	if (stateQuery) {
		const state = await State.findOne({ _id: stateQuery });
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});
			const userShopId = shop ? shop._id : null;
			const otherShopsInState = shopsInState.filter(
				(shop) => String(shop._id) !== String(userShopId)
			);
			if (lgaQuery) {
				const shopsInLGA = otherShopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				orConditions.push({ shop: { $in: shopIds } });
			} else {
				const shopIds = otherShopsInState.map(
					(shop) => shop._id
				);
				orConditions.push({ shop: { $in: shopIds } });
			}
		}
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			orConditions.push({ shop: { $in: shopIds } });
		}
	}

	if (orConditions.length > 0) {
		productsQuery.$or = orConditions;
	}

	console.log(productsQuery);

	return productsQuery;
};

//  Get products query
export const buildProductsQuery = async (
	query: any,
	shop: any
) => {
	const productsQuery = await buildCommonQuery(query, shop);
	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildProductsQueryGuest = async (
	query: any
) => {
	const productsQuery = await buildCommonQueryGuest(query);
	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

// Product banner query
export const buildBannerProductsQuery = async (
	query: any,
	shop: any,
	productIds: string[] = []
) => {
	// Build the common part of the query
	let productsQuery = await buildCommonQuery(query, shop);

	// Filter products by provided productIds
	if (productIds.length > 0) {
		productsQuery._id = {
			$in: productIds.map(
				(id) => new mongoose.Types.ObjectId(id)
			),
		};
	}

	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildBannerProductsQueryGuest = async (
	query: any,
	productIds: string[] = []
) => {
	// Build the common part of the query
	let productsQuery = await buildCommonQueryGuest(query);

	// Filter products by provided productIds
	if (productIds.length > 0) {
		productsQuery._id = {
			$in: productIds.map(
				(id) => new mongoose.Types.ObjectId(id)
			),
		};
	}

	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

// Deal query
export const buildDealsByCategoryQuery = async (
	query: any,
	shop: any,
	subcategoryId: string
) => {
	// Build the common part of the query
	let productsQuery = await buildCommonQuery(query, shop);

	// Add subcategory filter
	if (subcategoryId) {
		productsQuery.productCategory = subcategoryId;
	}

	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

// Deal query - guest
export const buildDealsByCategoryQueryGuest = async (
	query: any,
	subcategoryId: string
) => {
	// Build the common part of the query
	let productsQuery = await buildCommonQueryGuest(query);

	// Add subcategory filter
	if (subcategoryId) {
		productsQuery.productCategory = subcategoryId;
	}

	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

// Festive deal products query
export const buildProductsFestiveQuery = async (
	query: any,
	shop: any,
	tag: string
) => {
	// Build the common part of the query
	let productsQuery = await buildCommonQuery(query, shop);

	// Add the tag filter specific to festive products
	productsQuery.adminProductTags = tag;

	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

// Festive deal products query - guest
export const buildProductsFestiveQueryGuest = async (
	query: any,
	tag: string
) => {
	// Build the common part of the query
	let productsQuery = await buildCommonQueryGuest(query);

	// Add the tag filter specific to festive products
	productsQuery.adminProductTags = tag;

	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

// Near by product query
export const buildProductsNearYouQuery = async (
	query: any,
	shop: any
) => {
	// Build the common part of the query
	let productsQuery = await buildCommonQuery(query, shop);

	// Add specific condition for products near the shop
	productsQuery.shop = shop._id;

	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

// Clean utilities end

// checking the belows

export const buildWishlistProductQuery = async (
	query: any,
	userId: any,
	shop: any
) => {
	const searchQuery: string | undefined =
		query.search as string;
	const categoryQuery = query.category as
		| string
		| undefined;
	let minPrice: number | undefined = query.minPrice
		? Number(query.minPrice)
		: undefined;
	let maxPrice: number | undefined = query.maxPrice
		? Number(query.maxPrice)
		: undefined;
	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;

	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	const wishlists = await WishList.find({
		userId: userId,
	}).populate("items");

	const subcategories = wishlists
		.map((wishlist) =>
			//@ts-ignore
			wishlist.items.map((item) => item.productCategory)
		)
		.flat();

	let productsQuery: any = {
		productCategory: { $in: subcategories },
	};

	if (searchQuery) {
		productsQuery.$or = [
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				productDescription: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
		];
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			productsQuery.shop = { $in: shopIds };
			productsQuery.productCategory = category._id; // Filter products from shops with this category
		}
	}

	// if (minPrice == 0) {
	// 	minPrice = undefined;
	// }
	// if (maxPrice == 0) {
	// 	maxPrice = undefined;
	// }

	console.log(minPrice, maxPrice);

	if (minPrice !== undefined && maxPrice !== undefined) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (shop) {
		productsQuery.shop = { $ne: shop._id };
	}

	if (stateQuery) {
		const state = await State.findOne({ _id: stateQuery });
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});
			const userShopId = shop ? shop._id : null;
			const otherShopsInState = shopsInState.filter(
				(shop) => String(shop._id) !== String(userShopId)
			);
			if (lgaQuery) {
				const shopsInLGA = otherShopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				productsQuery.shop = { $in: shopIds };
			} else {
				const shopIds = otherShopsInState.map(
					(shop) => shop._id
				);
				productsQuery.shop = { $in: shopIds };
			}
		}
	}

	// return productsQuery;
	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildProductsQueryKeepShopping = async (
	query: any,
	shop: any,
	userId: any
) => {
	let productsQuery: any = { views: userId };

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;

	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;

	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	if (searchQuery) {
		productsQuery.$or = [
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
		];
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			productsQuery.shop = { $in: shopIds };
		}
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (shop) {
		productsQuery.shop = { $ne: shop._id };
	}

	if (stateQuery) {
		const state = await State.findOne({
			_id: stateQuery,
		});
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});
			const userShopId = shop._id;
			const otherShopsInState = shopsInState.filter(
				(shop) => String(shop._id) !== String(userShopId)
			);
			if (lgaQuery) {
				const shopsInLGA = otherShopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				productsQuery.shop = { $in: shopIds };
			} else {
				const shopIds = otherShopsInState.map(
					(shop) => shop._id
				);
				productsQuery.shop = { $in: shopIds };
			}
		}
	}

	// return productsQuery;
	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildProductsQueryTopDeals = async (
	query: any,
	shop: any,
	discountRate: number
) => {
	let productsQuery: any = {
		status: "verified",
		discountRate: { $gt: 24 },
	};

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;

	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;
	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	if (searchQuery) {
		productsQuery.$or = [
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
		];
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (shop) {
		productsQuery.shop = { $ne: shop._id };
	}
	if (stateQuery) {
		const state = await State.findOne({
			_id: stateQuery,
		});
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});
			const userShopId = shop._id;
			const otherShopsInState = shopsInState.filter(
				(shop) => String(shop._id) !== String(userShopId)
			);
			if (lgaQuery) {
				const shopsInLGA = otherShopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				productsQuery.shop = { $in: shopIds };
			} else {
				const shopIds = otherShopsInState.map(
					(shop) => shop._id
				);
				productsQuery.shop = { $in: shopIds };
			}
		}
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			productsQuery.shop = { $in: shopIds };
		}
	}

	// return productsQuery;
	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildProductsQueryTopDealsGuest = async (
	query: any
) => {
	let productsQuery: any = {
		status: "verified",
		discountRate: { $gt: 24 },
	};

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;

	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;
	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	if (searchQuery) {
		productsQuery.$or = [
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
		];
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (stateQuery) {
		const state = await State.findOne({
			_id: stateQuery,
		});
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});
			if (lgaQuery) {
				const shopsInLGA = shopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				productsQuery.shop = { $in: shopIds };
			} else {
				const shopIds = shopsInState.map(
					(shop) => shop._id
				);
				productsQuery.shop = { $in: shopIds };
			}
		}
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			productsQuery.shop = { $in: shopIds };
		}
	}

	// return productsQuery;
	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildProductsQueryLimited = async (
	query: any,
	shop: any
) => {
	let productsQuery: any = {
		status: "verified",
		stockQuantity: { $lt: 6 },
		discountRate: { $gt: 15 },
		quantitySold: { $gt: 0 },
	};

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;

	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;
	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	if (searchQuery) {
		productsQuery.$or = [
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
		];
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			productsQuery.shop = { $in: shopIds };
		}
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (shop) {
		productsQuery.shop = { $ne: shop._id };
	}
	if (stateQuery) {
		const state = await State.findOne({
			_id: stateQuery,
		});
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});
			const userShopId = shop._id;
			const otherShopsInState = shopsInState.filter(
				(shop) => String(shop._id) !== String(userShopId)
			);
			if (lgaQuery) {
				const shopsInLGA = otherShopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				productsQuery.shop = { $in: shopIds };
			} else {
				const shopIds = otherShopsInState.map(
					(shop) => shop._id
				);
				productsQuery.shop = { $in: shopIds };
			}
		}
	}

	// return productsQuery;
	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildProductsQueryLimitedGuest = async (
	query: any
) => {
	let productsQuery: any = {
		status: "verified",
		stockQuantity: { $lt: 6 },
		discountRate: { $gt: 15 },
		quantitySold: { $gt: 0 },
	};

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;

	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;
	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	if (searchQuery) {
		productsQuery.$or = [
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
		];
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			productsQuery.shop = { $in: shopIds };
		}
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (stateQuery) {
		const state = await State.findOne({
			_id: stateQuery,
		});
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});

			if (lgaQuery) {
				const shopsInLGA = shopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				productsQuery.shop = { $in: shopIds };
			} else {
				const shopIds = shopsInState.map(
					(shop) => shop._id
				);
				productsQuery.shop = { $in: shopIds };
			}
		}
	}

	// return productsQuery;
	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildProductsQueryFlash = async (
	query: any,
	shop: any
) => {
	let productsQuery: any = {
		status: "verified",
		discountRate: { $gt: 0 },
	};

	let orConditions: any[] = [];

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;
	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;

	if (searchQuery) {
		orConditions.push(
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			}
		);
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			orConditions.push({ shop: { $in: shopIds } });
		}
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (shop) {
		productsQuery.shop = { $ne: shop._id };
	}

	if (stateQuery) {
		const state = await State.findOne({ _id: stateQuery });
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});
			const userShopId = shop ? shop._id : null;
			const otherShopsInState = shopsInState.filter(
				(shop) => String(shop._id) !== String(userShopId)
			);
			if (lgaQuery) {
				const shopsInLGA = otherShopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				orConditions.push({ shop: { $in: shopIds } });
			} else {
				const shopIds = otherShopsInState.map(
					(shop) => shop._id
				);
				orConditions.push({ shop: { $in: shopIds } });
			}
		}
	}

	if (orConditions.length > 0) {
		productsQuery.$or = orConditions;
	}

	// return productsQuery;
	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildProductsQueryFlashGuest = async (
	query: any
) => {
	let productsQuery: any = {
		status: "verified",
		discountRate: { $gt: 0 },
	};

	let orConditions: any[] = [];

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;
	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;

	if (searchQuery) {
		orConditions.push(
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			}
		);
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			orConditions.push({ shop: { $in: shopIds } });
		}
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (stateQuery) {
		const state = await State.findOne({ _id: stateQuery });
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});

			if (lgaQuery) {
				const shopsInLGA = shopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				orConditions.push({ shop: { $in: shopIds } });
			} else {
				const shopIds = shopsInState.map(
					(shop) => shop._id
				);
				orConditions.push({ shop: { $in: shopIds } });
			}
		}
	}

	if (orConditions.length > 0) {
		productsQuery.$or = orConditions;
	}

	// return productsQuery;
	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildProductsQueryTopSellingProduct = async (
	query: any,
	shop: any
) => {
	let productsQuery: any = {
		status: "verified",
		quantitySold: { $gt: 0 },
		stockQuantity: { $gt: 0 },
	};

	let orConditions: any[] = [];

	const searchQuery = query.search as string | undefined;
	const categoryQuery = query.category as
		| string
		| undefined;
	const minPrice = query.minPrice
		? Number(query.minPrice)
		: undefined;
	const maxPrice = query.maxPrice
		? Number(query.maxPrice)
		: undefined;
	const page = parseInt(query.page as string) || 1;
	const limit = parseInt(query.limit as string) || 10;

	const stateQuery = query.stateQuery as string | undefined;
	const lgaQuery = query.lgaQuery as string | undefined;

	if (searchQuery) {
		orConditions.push(
			{
				productName: {
					$regex: new RegExp(searchQuery, "i"),
				},
			},
			{
				description: {
					$regex: new RegExp(searchQuery, "i"),
				},
			}
		);
	}

	if (categoryQuery) {
		const category = await Category.findOne({
			_id: categoryQuery,
		});
		if (category) {
			const shopWithCategory = await Shop.find({
				category: category._id,
			});
			const shopIds = shopWithCategory.map(
				(shop) => shop._id
			);
			orConditions.push({ shop: { $in: shopIds } });
		}
	}

	if (
		(minPrice !== undefined && minPrice !== 0) ||
		(maxPrice !== undefined && maxPrice !== 0)
	) {
		productsQuery.productPrice = {
			$gte: minPrice,
			$lte: maxPrice,
		};
	}

	if (shop) {
		productsQuery.shop = { $ne: shop._id };
	}

	if (stateQuery) {
		const state = await State.findOne({ _id: stateQuery });
		if (state) {
			const shopsInState = await Shop.find({
				state: state._id,
			});
			const userShopId = shop ? shop._id : null;
			const otherShopsInState = shopsInState.filter(
				(shop) => String(shop._id) !== String(userShopId)
			);
			if (lgaQuery) {
				const shopsInLGA = otherShopsInState.filter(
					(shop) => shop.lga === lgaQuery
				);
				const shopIds = shopsInLGA.map((shop) => shop._id);
				orConditions.push({ shop: { $in: shopIds } });
			} else {
				const shopIds = otherShopsInState.map(
					(shop) => shop._id
				);
				orConditions.push({ shop: { $in: shopIds } });
			}
		}
	}

	if (orConditions.length > 0) {
		productsQuery.$or = orConditions;
	}

	// return productsQuery;
	return {
		query: productsQuery,
		options: {
			page,
			limit,
		},
	};
};

export const buildProductsQueryTopSellingProductGuest =
	async (query: any) => {
		let productsQuery: any = {
			status: "verified",
			quantitySold: { $gt: 0 },
			stockQuantity: { $gt: 0 },
		};

		let orConditions: any[] = [];

		const searchQuery = query.search as string | undefined;
		const categoryQuery = query.category as
			| string
			| undefined;
		const minPrice = query.minPrice
			? Number(query.minPrice)
			: undefined;
		const maxPrice = query.maxPrice
			? Number(query.maxPrice)
			: undefined;
		const page = parseInt(query.page as string) || 1;
		const limit = parseInt(query.limit as string) || 10;

		const stateQuery = query.stateQuery as
			| string
			| undefined;
		const lgaQuery = query.lgaQuery as string | undefined;

		if (searchQuery) {
			orConditions.push(
				{
					productName: {
						$regex: new RegExp(searchQuery, "i"),
					},
				},
				{
					description: {
						$regex: new RegExp(searchQuery, "i"),
					},
				}
			);
		}

		if (categoryQuery) {
			const category = await Category.findOne({
				_id: categoryQuery,
			});
			if (category) {
				const shopWithCategory = await Shop.find({
					category: category._id,
				});
				const shopIds = shopWithCategory.map(
					(shop) => shop._id
				);
				orConditions.push({ shop: { $in: shopIds } });
			}
		}

		if (
			(minPrice !== undefined && minPrice !== 0) ||
			(maxPrice !== undefined && maxPrice !== 0)
		) {
			productsQuery.productPrice = {
				$gte: minPrice,
				$lte: maxPrice,
			};
		}

		if (stateQuery) {
			const state = await State.findOne({
				_id: stateQuery,
			});
			if (state) {
				const shopsInState = await Shop.find({
					state: state._id,
				});

				if (lgaQuery) {
					const shopsInLGA = shopsInState.filter(
						(shop) => shop.lga === lgaQuery
					);
					const shopIds = shopsInLGA.map(
						(shop) => shop._id
					);
					orConditions.push({ shop: { $in: shopIds } });
				} else {
					const shopIds = shopsInState.map(
						(shop) => shop._id
					);
					orConditions.push({ shop: { $in: shopIds } });
				}
			}
		}

		if (orConditions.length > 0) {
			productsQuery.$or = orConditions;
		}

		// return productsQuery;
		return {
			query: productsQuery,
			options: {
				page,
				limit,
			},
		};
	};
