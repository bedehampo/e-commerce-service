import algoliasearch from "algoliasearch";
import { NextFunction, Response } from "express";
import mongoose, { Types } from "mongoose";
import config from "../config";
import { NotFoundError, ValidationError } from "../errors";
import { successResponse } from "../helpers/index";
import { checkUserById } from "../middlewares/validators";
import { SubCategory } from "../model/admin/subCategory";
import { Shop } from "../model/shop/shop";
import { filterProductsService } from "../services";
import {
	analyzeSentiment,
	calculateDurationInDays,
	genProductDesc,
	generateUniqueSku,
	getTransactionOverview,
	notificationService,
	notifyShopFollowersOfNewProduct,
	notifyShopperOfNewProductDiscount,
	notifyShoppersOfNewSimilarProduct,
	promotionalProductNotification,
	userNotificationInfo,
	validatePin,
} from "../utils/global";
import {
	CustomRequest,
	StatusTypes,
} from "../utils/interfaces";
import {
	DeleteWholesaleInput,
	FilterProductInput,
	GenerateProductDescInput,
	ReviewProductInput,
	StockUpInput,
	GenerateProductDescInput2,
	NearByProductsInput,
	DeliveryTimeInput,
	RequestProductInput,
	StockUpNewInput,
} from "../validation/product.schema";
import { checkShopPermission } from "../middlewares/checkShopPermission";
import { ShopAction } from "../model/shop/shopActions";
import { uploadBlobService } from "../services/UploadService";
import { ProductStatus } from "../types/shop";
import {
	calculateProductPrice,
	checkProductCategoryExistence,
	checkProductExistence,
	createProduct,
	extractProductData,
	findActiveShop,
	saveOrUpdateHashtags,
	saveShopAction,
	validateProductImages,
	validateVariations,
	getUserIdAndUser,
	extractProductDataEdit,
	checkProductExistenceById,
	updateProduct,
	processProductForDisplay,
	findShopByUserId,
	buildProductsQuery,
	findProducts,
	findShopVerifiedProducts,
	findProduct,
	checkOutOfStockProduct,
	extractProductWholesale,
	fetchProductCategories,
	findOrder,
	findProductReview,
	buildProductsQueryLimited,
	buildProductsQueryFlash,
	findFlashProducts,
	buildProductsQueryTopDeals,
	buildProductsQueryKeepShopping,
	buildFilterConditions,
	buildPipeline,
	fetchNearbyShops,
	handleResponse,
	fetchProductsForShops,
	myProductQuery,
	findPopulatedProduct,
	buildProductsFestiveQuery,
	buildDealsByCategoryQuery,
	buildBannerProductsQuery,
	singleProduct,
	buildProductsQueryTopSellingProduct,
	topSellingProducts,
	validateProperties,
	buildPipelineGuest,
	buildProductsQueryTopDealsGuest,
	buildProductsQueryFlashGuest,
	buildProductsQueryTopSellingProductGuest,
	buildDealsByCategoryQueryGuest,
	buildProductsQueryLimitedGuest,
	buildProductsFestiveQueryGuest,
	buildBannerProductsQueryGuest,
	processProductForDisplayGuest,
	buildProductsQueryGuest,
	// validateProperties,
} from "../services/product/productServices";
import { differenceInDays } from "date-fns";
import { Category } from "../model/admin/category";
import { HashTag } from "../model/shop/hashtag";
import { Product } from "../model/shop/product";
import { State } from "../model/shop/state";
import { AdminPLCategoryModel } from "../model/admin/adminProductDeals";
import { AdminProductSectionModel } from "../model/admin/adminProductSection";
import { WishList } from "../model/shop/wishlist";
import { Order } from "../model/shop/order";
import {
	lowDealStock,
	noDealStock,
} from "./dealController";
import { PLPBannerModel } from "../model/admin/adminPLPBanner";
import { CartItem } from "../model/shop/cartItem";
import {
	OrderDeliveryStatus,
	OrderPaymentStatus,
	OrderStatus,
} from "../types/order";
import { Review } from "../model/shop/Review";
import { RequestProductModel } from "../model/shop/requestProduct";
import { CountryModel } from "../model/countries";
import { getCountryCallingCode } from "../../node_modules/libphonenumber-js/max/exports/getCountryCallingCode";
import { countries } from "countries-list";
import { RejectedOrderReason } from "../model/shop/rejectedOrdersReason";

const client = algoliasearch(
	config.algolia.appId,
	config.algolia.apiKey
);
const ProductIndex = client.initIndex("products");
const Generic = client.initIndex("motopay");
const Dummy = client.initIndex("dummy");

// Upload product - shop owner
export const uploadProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	console.log("Hello Coco");
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		// getting user information
		const { userId } = await getUserIdAndUser(req);

		// upload product payload
		const productData = extractProductData(req);

		// verify upload product permission
		await checkShopPermission(
			userId,
			productData.shopId.toString(),
			"add_product"
		);

		// // verify shop state
		const shop = await findActiveShop(productData.shopId);

		// // validate product category (sub-category)

		await checkProductCategoryExistence(
			productData.productCategory
		);

		// // validate product images
		await validateProductImages(productData.productImages);

		// // validate variations
		const validatedVariation = await validateVariations(
			productData.variations
		);

		// Validate product properties
		const validatedProperties = await validateProperties(
			productData.properties
		);

		// Check if product exists
		await checkProductExistence(
			productData.productName,
			productData.shopId
		);

		// // validate hashTags
		const newHashTags = await saveOrUpdateHashtags(
			productData.tags
		);

		// // getting product price
		const { productPrice, sales } = calculateProductPrice(
			productData.actualPrice,
			productData.discountAmount
		);

		// //  save shop permission activities
		await saveShopAction(
			userId,
			"added a new product.",
			shop._id.toString()
		);

		const sku = await generateUniqueSku(
			shop._id,
			productData.productName
		);

		// // save product
		const product = await createProduct(
			productData,
			newHashTags,
			validatedVariation,
			validatedProperties,
			productPrice,
			sales,
			shop.category,
			sku
		);

		// Notify shop followers of new Product
		const followers = shop.followers;
		await notifyShopFollowersOfNewProduct(
			followers,
			productData,
			shop
		);

		// Notify shoppers of new product
		product.discountRate > 0 &&
			(await notifyShopperOfNewProductDiscount(
				userId,
				productData,
				product.discountRate
			));

		// Notify users of similar products update
		product.discountRate > 0 &&
			(await notifyShoppersOfNewSimilarProduct(
				userId,
				productData,
				product.discountRate,
				product.productCategory
			));

		await session.commitTransaction();
		session.endSession();
		return res.send(
			successResponse(
				"Product uploaded successfully",
				product
			)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

// Edit product - shop owner
export const editProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		const userService = req.userService;

		// Extract d product details from the request body
		const productData = await extractProductDataEdit(req);

		// check if the product exit
		const productExit = await checkProductExistenceById(
			productData.productId
		);

		await validateProductImages(productData.productImages);

		//    check shop permission
		await checkShopPermission(
			userId,
			productExit.shop.toString(),
			"edited a product"
		);

		// verify shop
		const shop = await findActiveShop(
			productExit.shop.toString()
		);

		// checking for product category in sub-category
		await checkProductCategoryExistence(
			productData.productCategory
		);
		// validate variations
		const validatedVariation = await validateVariations(
			productData.variations
		);

		// Validate product properties
		const validatedProperties = await validateProperties(
			productData.properties
		);

		// // validate hashTags
		const newHashTags = await saveOrUpdateHashtags(
			productData.tags
		);

		// // getting product price
		const { productPrice, sales } = calculateProductPrice(
			productData.actualPrice,
			productData.discountAmount
		);

		// Update the existing product using findByIdAndUpdate
		const updatedProduct = await updateProduct(
			productData,
			newHashTags,
			validatedVariation,
			validatedProperties,
			productPrice,
			sales,
			shop.category
		);

		// sending notification when wishlist product price reduces
		if (
			productExit.productPrice > updatedProduct.productPrice
		) {
			// fetch all the wishlists with this product
			const wishLists = await WishList.find({
				items: { $in: [productExit._id] },
			});

			for (const wishList of wishLists) {
				const user = await checkUserById(
					wishList.userId,
					userService
				);
				const message = `Hello ${user.firstName}\n,The price of ${updatedProduct.productName} in your wishlist has been reduced.`;

				await notificationService(
					"Hallmark",
					user,
					"Price Reduction",
					message
				);
			}
		}

		const shopAction = new ShopAction({
			user: userId,
			action: "edited a product",
			shop: shop._id,
		});
		await shopAction.save();
		res.send(
			successResponse(
				"Product updated successfully",
				updatedProduct
			)
		);
	} catch (error) {
		next(error);
	}
};

// get single product - users | shop owner
export const getSingleProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);

		const { id } = req.params;

		let product = await findPopulatedProduct(id);

		let displayProduct = await processProductForDisplay(
			product,
			userId
		);
		// Get quantity Sold

		return res.send(
			successResponse(
				"Product retrieved successfully",
				displayProduct
			)
		);
	} catch (error) {
		// Log the error for debugging purposes
		console.error(error);

		// Pass the error to the next middleware
		next(error);
	}
};

// get single product - guest
export const getSingleProductGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;

		let product = await findPopulatedProduct(id);

		let displayProduct =
			await processProductForDisplayGuest(product);
		// Get quantity Sold

		return res.send(
			successResponse(
				"Product retrieved successfully - guest",
				displayProduct
			)
		);
	} catch (error) {
		// Log the error for debugging purposes
		console.error(error);

		// Pass the error to the next middleware
		next(error);
	}
};

// get all products -
export const getProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);

		// check if user have a shop
		const shop = await findShopByUserId(userId);

		const productsQuery = await buildProductsQuery(
			req.query,
			shop
		);

		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
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

// Get product guest
export const getProductsGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const productsQuery = await buildProductsQueryGuest(
			req.query
		);

		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
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

// Get countries
export const getCountries = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		await getUserIdAndUser(req);

		// Extract the search query from request parameters
		const { name } = req.query;

		// Build the query
		const query: any = {};
		if (name) {
			query.name = new RegExp(`^${name}`, "i");
		}

		const countries = await CountryModel.find(query).select(
			"_id name"
		);
		return res.send(
			successResponse(
				"Countries retrieved successfully",
				countries
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getCountry = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		await getUserIdAndUser(req);
		const id = req.params.id;

		const country = await CountryModel.findOne({
			_id: id,
		}).select("_id name");

		if (!country)
			throw new NotFoundError("country not found");

		return res.send(
			successResponse(
				"Country retrieved successfully",
				country
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get - Top selling products
export const getTopSellingProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		const shop = await findShopByUserId(userId);
		const productQuery =
			await buildProductsQueryTopSellingProduct(
				req.query,
				shop
			);

		let products = await topSellingProducts(
			productQuery.query,
			productQuery.options
		);

		return res.send(
			successResponse(
				"Top selling products retrieved successfully",
				products
			)
		);
	} catch (error) {
		console.error(`The error: ${error}`);
		next(error);
	}
};

// top selling product - guest
export const getTopSellingProductsGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const productQuery =
			await buildProductsQueryTopSellingProductGuest(
				req.query
			);

		let products = await topSellingProducts(
			productQuery.query,
			productQuery.options
		);

		return res.send(
			successResponse(
				"Top selling products retrieved successfully - guest",
				products
			)
		);
	} catch (error) {
		console.error(`The error: ${error}`);
		next(error);
	}
};

export const festiveProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		// check if user have a shop
		const shop = await findShopByUserId(userId);
		// get admin product listing
		const adminPLSection =
			await AdminProductSectionModel.findOne({
				sectionName: "festive-deals",
			});
		if (!adminPLSection)
			throw new NotFoundError(
				"this Product listing section not found"
			);
		// building query
		const productsQuery = await buildProductsFestiveQuery(
			req.query,
			shop,
			adminPLSection._id.toString()
		);
		// getting products
		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
		);
		// return response
		return res.send(
			successResponse(
				"Festive products retrieved successfully",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

export const festiveProductsGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// get admin product listing
		const adminPLSection =
			await AdminProductSectionModel.findOne({
				sectionName: "festive-deals",
			});
		if (!adminPLSection)
			throw new NotFoundError(
				"this Product listing section not found"
			);
		// building query
		const productsQuery =
			await buildProductsFestiveQueryGuest(
				req.query,
				adminPLSection._id.toString()
			);
		// getting products
		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
		);
		// return response
		return res.send(
			successResponse(
				"Festive products retrieved successfully -guest",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getApplianceDeals = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		// check if user have a shop
		const shop = await findShopByUserId(userId);
		// get admin product listing
		const adminPLSection =
			await AdminProductSectionModel.findOne({
				sectionName: "appliance-deal",
			});
		if (!adminPLSection)
			throw new NotFoundError(
				"this Product listing section not found"
			);
		// building query
		const productsQuery = await buildProductsFestiveQuery(
			req.query,
			shop,
			adminPLSection._id.toString()
		);
		// getting products
		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
		);
		// return response
		return res.send(
			successResponse(
				"products retrieved successfully",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getApplianceDealsGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// get admin product listing
		const adminPLSection =
			await AdminProductSectionModel.findOne({
				sectionName: "appliance-deal",
			});
		if (!adminPLSection)
			throw new NotFoundError(
				"this Product listing section not found"
			);
		// building query
		const productsQuery =
			await buildProductsFestiveQueryGuest(
				req.query,
				adminPLSection._id.toString()
			);
		// getting products
		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
		);
		// return response
		return res.send(
			successResponse(
				"products retrieved successfully - guest",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};
//change this
export const bigSavingProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		// check if user have a shop
		const shop = await findShopByUserId(userId);
		const productQuery = await buildProductsQueryTopDeals(
			req.query,
			shop,
			39
		);

		const products = await findProducts(
			productQuery.query,
			productQuery.options
		);
		return res.send(
			successResponse(
				"Big saving products retrieved successfully",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

// get big saving - guest
export const bigSavingProductsGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const productQuery =
			await buildProductsQueryTopDealsGuest(req.query);

		const products = await findProducts(
			productQuery.query,
			productQuery.options
		);
		return res.send(
			successResponse(
				"Big saving products retrieved successfully - guest",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

// get top deal - products with discount
export const getTopProductDeals = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		const shop = await findShopByUserId(userId);

		const productQuery = await buildProductsQueryTopDeals(
			req.query,
			shop,
			0
		);
		const products = await findProducts(
			productQuery.query,
			productQuery.options
		);
		return res.send(
			successResponse(
				"Top product deals retrieved successfully",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getTopProductDealsGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const productQuery =
			await buildProductsQueryTopDealsGuest(req.query);
		const products = await findProducts(
			productQuery.query,
			productQuery.options
		);
		return res.send(
			successResponse(
				"Top product deals retrieved successfully -guest",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get - products near you
export const productsNearYou = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const data = req.body as NearByProductsInput["body"];
		const { location } = data;

		// Extract filter conditions
		const filterConditions = await buildFilterConditions(
			userId
		);

		// Build pipeline
		const pipeline = await buildPipeline(
			location,
			filterConditions,
			userId
		);

		// Fetch products for shops
		const productsNearBy = await fetchProductsForShops(
			req.query,
			pipeline
		);

		// Handle response
		return handleResponse(
			res,
			"Nearby products fetched successfully",
			productsNearBy
		);
	} catch (error) {
		next(error);
	}
};

// Nearby product - Guest
export const productsNearYouGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const data = req.body as NearByProductsInput["body"];
		const { location } = data;

		// Build pipeline
		const pipeline = await buildPipelineGuest(location);

		// Fetch products for shops
		const productsNearBy = await fetchProductsForShops(
			req.query,
			pipeline
		);

		// Handle response
		return handleResponse(
			res,
			"Nearby products fetched successfully - Guest",
			productsNearBy
		);
	} catch (error) {
		next(error);
	}
};

// get flash sales
export const flashSales = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		const shop = await findShopByUserId(userId);
		const productQuery = await buildProductsQueryFlash(
			req.query,
			shop
		);

		let products = await findFlashProducts(
			productQuery.query,
			productQuery.options
		);

		return res.send(
			successResponse(
				"Flash sales products retrieved successfully",
				products
			)
		);
	} catch (error) {
		console.error(`The error: ${error}`);
		next(error);
	}
};

// Get flash sales guest
export const flashSalesGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const productQuery = await buildProductsQueryFlashGuest(
			req.query
		);

		let products = await findFlashProducts(
			productQuery.query,
			productQuery.options
		);

		return res.send(
			successResponse(
				"Flash sales products retrieved successfully - guest",
				products
			)
		);
	} catch (error) {
		console.error(`The error: ${error}`);
		next(error);
	}
};

// Best Phone Deals endpoints
export const bestProductDealsBySubCategory = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		// get the sub-category
		const subcategoryId = req.params.id;
		// get the subcategories
		const subCat = await SubCategory.findById(
			subcategoryId
		);
		if (!subCat)
			throw new NotFoundError("sub-category not found");
		// ensuring the user don't get their own products
		const shop = await findShopByUserId(userId);
		// Getting product queries
		const productQuery = await buildDealsByCategoryQuery(
			req.query,
			shop,
			subcategoryId
		);
		// getting the products
		let products = await findProducts(
			productQuery.query,
			productQuery.options
		);
		// Sort the products by discountRate
		products.sort(
			(a, b) => b.discountRate - a.discountRate
		);

		return res.send(
			successResponse(
				`Top ${subCat.name} products fetched successfully`,
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

// Best Phone Deals endpoints - guest
export const bestProductDealsBySubCategoryGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// get the sub-category
		const subcategoryId = req.params.id;
		// get the subcategories
		const subCat = await SubCategory.findById(
			subcategoryId
		);
		if (!subCat)
			throw new NotFoundError("sub-category not found");

		// Getting product queries
		const productQuery =
			await buildDealsByCategoryQueryGuest(
				req.query,
				subcategoryId
			);
		// getting the products
		let products = await findProducts(
			productQuery.query,
			productQuery.options
		);
		// Sort the products by discountRate
		products.sort(
			(a, b) => b.discountRate - a.discountRate
		);

		return res.send(
			successResponse(
				`Top ${subCat.name} products fetched successfully - guest`,
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

// limitedStock products
export const limitedStock = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		const shop = await findShopByUserId(userId);

		const productsQuery = await buildProductsQueryLimited(
			req.query,
			shop
		);

		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
		);
		// Calculate the number of days each product has existed
		products = products.map((product) => ({
			...product.toJSON(),
			daysSinceCreation: differenceInDays(
				new Date(),
				product.createdAt
			),
		}));

		// Filter products to include only those with daysSinceCreation >= 60
		products = products.filter(
			//@ts-ignore
			(product) => product.daysSinceCreation >= 30
		);

		return res.send(
			successResponse(
				"Limited stock products retrieved successfully",
				products
			)
		);
	} catch (error) {
		console.error(`The error: ${error}`);
		next(error);
	}
};

// limitedStock products - guest
export const limitedStockGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const productsQuery =
			await buildProductsQueryLimitedGuest(req.query);

		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
		);
		// Calculate the number of days each product has existed
		products = products.map((product) => ({
			...product.toJSON(),
			daysSinceCreation: differenceInDays(
				new Date(),
				product.createdAt
			),
		}));

		// Filter products to include only those with daysSinceCreation >= 60
		products = products.filter(
			//@ts-ignore
			(product) => product.daysSinceCreation >= 30
		);

		return res.send(
			successResponse(
				"Limited stock products retrieved successfully - stock",
				products
			)
		);
	} catch (error) {
		console.error(`The error: ${error}`);
		next(error);
	}
};

// Get all shop products - user
export const getShopProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const { shopId } = req.params;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;

		const options = { page, limit };

		const shop = await findActiveShop(shopId);

		let products = await findShopVerifiedProducts(
			shop,
			options
		);
		return res.send(
			successResponse("Shop Products", products)
		);
	} catch (error) {
		next(error);
	}
};

// Get my shop products -vendor
export const getMyShopProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);

		const shopId = req.params.id;
		const query = req.query.query as string;
		const search = req.query.search as string;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const options = { page, limit };
		const subcategory = req.query.subcategory as string;

		// verify permission to check use this endpoint
		await checkShopPermission(
			userId,
			shopId,
			"view_product"
		);

		let products = await myProductQuery(
			query,
			search,
			subcategory,
			shopId,
			options
		);

		const shop = await findActiveShop(shopId.toString());

		// save activity perform on shop
		const shopAction = new ShopAction({
			user: userId,
			action: "viewed a product",
			shop: shop._id,
		});
		await shopAction.save();

		return handleResponse(
			res,
			"My products retrieved successfully",
			products
		);
	} catch (error) {
		next(error);
	}
};

// view my shop single product
export const getMySingleProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		const { shopId, productId } = req.params;

		await checkShopPermission(
			userId,
			shopId.toString(),
			"view_product"
		);

		let product = await singleProduct(productId, shopId);

		const shopAction = new ShopAction({
			user: userId,
			action: "viewed a product",
			shop: shopId,
		});

		await shopAction.save();

		return res.send(
			successResponse(
				"My product retrieved successfully",
				product
			)
		);
	} catch (error) {
		next(error);
	}
};

// delete product - shop-owner
export const deleteProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from params
		const { userId } = await getUserIdAndUser(req);

		// Getting productId
		const { productId } = req.params;

		// Find the product by its ID
		const product = await findProduct(productId);

		const shopId = product.shop;
		await checkShopPermission(
			userId,
			shopId.toString(),
			"delete_product"
		);

		const shop = await findActiveShop(shopId.toString());

		// Check if the product status is already "deleted"
		if (product.status === "deleted")
			throw new ValidationError("Product already deleted");

		// Update the product status to "deleted"
		product.status = ProductStatus.DELETED;

		const shopAction = new ShopAction({
			user: userId,
			action: "deleted a product",
			shop: shopId,
		});
		await shopAction.save();
		await product.save();

		res.send(
			successResponse(
				"Product deleted successfully",
				product
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get all Product Listing banners
export const getPLBanner4User = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		await getUserIdAndUser(req);
		const plBanner = await PLPBannerModel.find().select(
			"banner"
		);
		return res.send(
			successResponse(
				"PL banners fetch successfully",
				plBanner
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get all Product Listing banners - guest
export const getPLBanner4UserGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const plBanner = await PLPBannerModel.find().select(
			"banner"
		);
		return res.send(
			successResponse(
				"PL banners fetch successfully - guest",
				plBanner
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getPLBannerProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		const id = req.params.id;
		const plBanner = await PLPBannerModel.findById(id);
		if (!plBanner)
			throw new NotFoundError(
				"product listing banner not found"
			);
		// Extract product IDs from the plBanner
		const productIds = plBanner.products.map((product) =>
			product.toString()
		);
		// check if user have a shop
		const shop = await findShopByUserId(userId);
		// Build product query
		const productsQuery = await buildBannerProductsQuery(
			req.query,
			shop,
			productIds
		);
		// Get products
		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
		);

		return res.send(
			successResponse(
				"Banner products retrieved successfully",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getPLBannerProductsGuest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const id = req.params.id;
		const plBanner = await PLPBannerModel.findById(id);
		if (!plBanner)
			throw new NotFoundError(
				"product listing banner not found"
			);
		// Extract product IDs from the plBanner
		const productIds = plBanner.products.map((product) =>
			product.toString()
		);
		// Build product query
		const productsQuery =
			await buildBannerProductsQueryGuest(
				req.query,
				productIds
			);
		// Get products
		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
		);

		return res.send(
			successResponse(
				"Banner products retrieved successfully",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

// Increase product stock - shop owner - New Endpoint
export const stockUpProductNew = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const { productId, stockUpdates } =
			req.body as StockUpNewInput["body"];

		const product = await checkOutOfStockProduct(productId);
		const productStatus = product.status;

		// New implementation for stock up
		await checkShopPermission(
			userId,
			product.shop.toString(),
			"stock_up"
		);

		await findActiveShop(product.shop.toString());

		let overallStockChange = 0;

		// Iterate over each stock update
		for (const update of stockUpdates) {
			const { colorId, stockQuantity } = update;

			// Find the product image that matches the selected color
			const productImage = product.productImages.find(
				(image) =>
					image.color.toString() === colorId.toString()
			);

			if (!productImage) {
				throw new Error(
					`Product image with color ID ${colorId} not found.`
				);
			}

			const initialQty = productImage.quantity;

			// Update the quantity of the specific product image
			productImage.quantity = stockQuantity;

			// Calculate the change in stock
			overallStockChange +=
				productImage.quantity - initialQty;
		}

		// Recalculate the overall stock quantity
		product.stockQuantity = product.productImages.reduce(
			(total, image) => total + image.quantity,
			0
		);
		product.status = ProductStatus.VERIFIED;

		// Save product once after all updates
		await product.save();

		// Send notification only if stock was previously out and now increased
		if (
			productStatus === "out-of-stock" &&
			overallStockChange > 0
		) {
			const userIds = product.views;
			const notificationPromises = userIds.map(
				async (viewUserId) => {
					const user = await checkUserById(
						viewUserId,
						req.userService
					);
					const message = `Hello ${user.firstName},\n\nThe product ${product.productName} you viewed is now back in stock.`;
					return notificationService(
						"MotoPay E-commerce",
						user,
						"Product Restocked",
						message
					);
				}
			);
			await Promise.all(notificationPromises);
		}

		// Save shop action
		const shopAction = new ShopAction({
			user: userId,
			action: "updated product stock.",
			shop: product.shop,
		});
		await shopAction.save();

		res.send(
			successResponse(
				`Product stock ${
					overallStockChange > 0 ? "increased" : "decreased"
				} successfully`,
				product
			)
		);
	} catch (error) {
		next(error);
	}
};

// Increase product stock - shop owner
export const stockUpProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const { productId, stockQuantity } =
			req.body as StockUpInput["body"];

		const product = await checkOutOfStockProduct(productId);
		const currentStock = product.stockQuantity;
		const productStatus = product.status;

		await checkShopPermission(
			userId,
			product.shop.toString(),
			"stock_up"
		);

		await findActiveShop(product.shop.toString());

		// Determine if stock is being increased or decreased
		const isStockIncreased = stockQuantity > currentStock;

		product.stockQuantity = stockQuantity;
		product.status = ProductStatus.VERIFIED;
		await product.save();

		// Determine the action based on stock change
		const action = isStockIncreased
			? "stocked up a product."
			: "reduced the stock of a product";

		// Send notification only if stock was previously out and now increased
		if (
			productStatus === "out-of-stock" &&
			isStockIncreased
		) {
			const userIds = product.views;
			for (const viewUserId of userIds) {
				const user = await checkUserById(
					viewUserId,
					req.userService
				);
				const message = `Hello ${user.firstName},\n\nThe product ${product.productName} you viewed is now back in stock.`;
				await notificationService(
					"MotoPay E-commerce",
					user,
					"Product Restocked",
					message
				);
			}
		}

		const shopAction = new ShopAction({
			user: userId,
			action: action,
			shop: product.shop,
		});
		await shopAction.save();

		res.send(
			successResponse(
				`Product stock ${
					isStockIncreased ? "increased" : "decreased"
				} successfully`,
				product
			)
		);
	} catch (error) {
		next(error);
	}
};

// export const stockUpProduct = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		// Getting user id from params
// 		const { userId } = await getUserIdAndUser(req);

// 		const { productId, stockQuantity } =
// 			req.body as StockUpInput["body"];

// 		const product = await checkOutOfStockProduct(productId);

// 		const productStatus = product.status;

// 		await checkShopPermission(
// 			userId,
// 			product.shop.toString(),
// 			"stock_up"
// 		);

// 		await findActiveShop(product.shop.toString());

// 		product.stockQuantity = stockQuantity;
// 		product.status = ProductStatus.VERIFIED;
// 		await product.save();

// 		// send notification to user about product stock
// 		if (productStatus == "out-of-stock") {
// 			const userIds = product.views;
// 			for (const viewUserId of userIds) {
// 				const user = await checkUserById(
// 					viewUserId,
// 					req.userService
// 				);
// 				const message = `Hello ${user.firstName},\n\nThe product ${product.productName} you viewed is now back in stock.`;
// 				await notificationService(
// 					"MotoPay E-commerce",
// 					user,
// 					"Product Restocked",
// 					message
// 				);
// 			}
// 		}

// 		const shopAction = new ShopAction({
// 			user: userId,
// 			action: "stocked up a product.",
// 			shop: product.shop,
// 		});
// 		await shopAction.save();
// 		res.send(
// 			successResponse(
// 				"Product stock increase successfully",
// 				product
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// Decrease product stock - shop owner
export const stockDownProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from params
		const { userId } = await getUserIdAndUser(req);

		const { productId, stockQuantity } =
			req.body as StockUpInput["body"];

		const product = await checkOutOfStockProduct(productId);

		await checkShopPermission(
			userId,
			product.shop.toString(),
			"stock_up"
		);

		await findActiveShop(product.shop.toString());

		product.stockQuantity -= stockQuantity;
		product.status = ProductStatus.VERIFIED;
		await product.save();
		const shopAction = new ShopAction({
			user: userId,
			action: "reduced the stock of a product",
			shop: product.shop,
		});
		await shopAction.save();
		res.send(
			successResponse(
				"Product stock decrease successfully",
				product
			)
		);
	} catch (error) {
		next(error);
	}
};

export const filterProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const params = req.query as FilterProductInput["params"];

	const { userId } = await getUserIdAndUser(req);

	let perPage = params.per_page
		? Number(params.per_page)
		: 10;
	let page = params.page ? Number(params.page) : 1;

	params.per_page = perPage;
	params.page = page;

	try {
		const products = await filterProductsService(
			params,
			userId
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

export const keepShoppingProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		const shop = await findShopByUserId(userId);

		let productsQuery =
			await buildProductsQueryKeepShopping(
				req.query,
				shop,
				userId
			);

		let products = await findProducts(
			productsQuery.query,
			productsQuery.options
		);

		return res.send(
			successResponse("Keep shopping products", products)
		);
	} catch (error) {
		next(error);
	}
};

// delete product wholesale - shop-owner
export const deleteProductWholesale = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from params
		const { userId } = await getUserIdAndUser(req);

		const { productId, wholesaleId } =
			req.body as DeleteWholesaleInput["body"];

		// Find the existing product
		const existingProduct = await checkProductExistenceById(
			productId
		);

		await checkShopPermission(
			userId,
			existingProduct.shop.toString(),
			"delete_product"
		);

		await extractProductWholesale(
			wholesaleId,
			existingProduct
		);

		const shopAction = new ShopAction({
			user: userId,
			action: "delete_wholesale",
			shop: existingProduct.shop,
		});
		await shopAction.save();

		return res.send(
			successResponse(
				"Product wholesale deleted successfully",
				existingProduct
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get product categories for a shop - shop owner
export const getProductCategories = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);

		const shopId = req.params.shopId;

		await checkShopPermission(
			userId,
			shopId.toString(),
			"add_product"
		);

		const shop = await findActiveShop(shopId);

		const category = shop.category;

		const productCategories = await fetchProductCategories(
			category.toString()
		);
		return res.send(
			successResponse(
				"Product categories retrieved successfully",
				productCategories
			)
		);
	} catch (error) {
		next(error);
	}
};

// get product hashtags
export const getProductHashTags = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// getting user info
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		const tags = await HashTag.find();
		return res.send(
			successResponse(
				"product hashtags retrieved successfully",
				tags
			)
		);
	} catch (error) {
		next(error);
	}
};

// get product hashtag
export const getProductHashTag = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// getting user info
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const { id } = req.params;
		const tag = await HashTag.findById({
			_id: id,
		});
		return res.send(
			successResponse(
				"product hashtags retrieved successfully",
				tag
			)
		);
	} catch (error) {
		next(error);
	}
};

export const generateProductDesc2 = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);

		const {
			productName,
			shopCategoryId,
			productCategoryId,
			productBrand,
		} = req.body as GenerateProductDescInput2["body"];
		// check if the shop category exist
		const categoryExit = await Category.findOne({
			_id: shopCategoryId,
		});

		if (!categoryExit)
			throw new NotFoundError("category not found");
		// check if the sub category exist
		const subCategoryExit = await SubCategory.findOne({
			_id: productCategoryId,
		});

		if (!subCategoryExit)
			throw new NotFoundError("product category not found");

		const generatedDesc = await genProductDesc(
			productName,
			categoryExit.name,
			subCategoryExit.name,
			productBrand
		);

		return res.send(
			successResponse(
				"product description generated successfully",
				generatedDesc
			)
		);
	} catch (error) {
		next(error);
	}
};

// BNPL Start
export const checkForBNPLValidity = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId, user } = await getUserIdAndUser(req);
		const token = req.header("authorization").split(" ")[1];

		// Get user registration date
		const createdOnDate = new Date(user.createdOn);
		// Today's date
		const currentDate = new Date();
		// Calculate number of days
		const noOfDays = await calculateDurationInDays(
			createdOnDate,
			currentDate
		);

		const transactionOverview =
			await getTransactionOverview(token);
		// Check if user passed the eligibility criteria
		if (
			user.tier >= 2 &&
			noOfDays >= 30 &&
			transactionOverview.totalTransactions >= 200000
		) {
			return res.send(
				successResponse(
					"You are eligible for buy now and pay later",
					{
						eligible: true,
					}
				)
			);
		} else {
			return res.send(
				successResponse(
					"You are not eligible for buy now and pay later",
					{
						eligible: false,
					}
				)
			);
		}
	} catch (error) {
		next(error);
	}
};

// BNPL End

// Clean code above
export const alogliaFilterProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const records = [
		{
			name: "iPhone XR Black 64GB",
			description:
				"iPhone XR features the most advanced LCD in a smartphone—a 6.1-inch Liquid Retina display with industry-leading color accuracy and an innovative backlight design that allows the screen to stretch into the corners.",
			brand: "Apple",
			price: 749.99,
		},
		{
			name: "iPhone XS Gold 64GB",
			description:
				"The iPhone XS smartphone features a 5.8-inch Super Retina display with custom-built OLED panels for an HDR display that provides the industry's best color accuracy, true blacks, and remarkable brightness.",
			brand: "Apple",
			price: 999.99,
		},
		{
			name: "Galaxy Note9 Ocean Blue 128GB",
			description:
				"The new super powerful Note. Galaxy Note9 has the largest amount of storage offered in a Samsung smartphone.",
			brand: "Samsung",
			price: 900.0,
		},
		{
			name: "G7 ThinQ™ Platinum Gray 64GB",
			description:
				"LG'S greatest smartphpne yet. Advanced AI multimedia phone!",
			brand: "LG",
			price: 600.0,
		},
		{
			name: "Moto E5 Play 16GB",
			description:
				"Keep your smartphone protected with a water-repellent coating. Make room for more photos, songs, and videos with expandable storage.",
			brand: "Motorola",
			price: 150.0,
		},
	];

	Generic.setSettings({
		searchableAttributes: [
			"name",
			"description",
			"categories",
			"brand",
		],
	});
	const { search, min_price, max_price, brand } =
		req.query as FilterProductInput["params"];

	let filters = "";

	if (brand) {
		filters += `brand:${brand}`;
	}
	// if (min_price && max_price) {
	//   filters += ` price >= ${min_price} AND price <= ${max_price} `;
	// }
	// if (min_price && !max_price) {
	//   filters += ` price >= ${min_price} `;
	// }
	// if (!min_price && max_price) {
	//   filters += ` price <= ${max_price} `;
	// }

	try {
		// const reponse = await Dummy.saveObjects(records, {
		//   autoGenerateObjectIDIfNotExist: true,
		// });
		//  Dummy.setSettings({
		//   attributesForFaceting: [
		//     "brand", // or 'filterOnly(brand)' for filtering purposes only
		//   ],
		// });
		//    return res.send(successResponse("Product deleted successfully", "reponse"));
		// const products = await Dummy.search("phone", {
		//   filters: "brand:Motorola",
		// });

		const response = await ProductIndex.search(
			search ? search : "",
			{
				filters,
				hitsPerPage: 500,
			}
		);
		res.send(
			successResponse("Product deleted successfully", {
				count: response.hits.length,
				products: response,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const checkReviewProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Extract user id
		const { userId } = await getUserIdAndUser(req);
		// Extract params id
		const id = req.params.id;

		// Get Review
		const review = await Review.findOne({
			user: userId,
			product: id,
		});

		const data = !!review;
		const msg = review
			? "You have already reviewed this product"
			: "You have not reviewed this product";

		return res.send(successResponse(msg, data));
	} catch (error) {
		next(error);
	}
};

export const reviewProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const { productId, rating, review } =
		req.body as ReviewProductInput["body"];
	// console.log(productId);

	const session = await mongoose.startSession();

	try {
		session.startTransaction();
		const productExists = await findProduct(productId);

		const { userId } = await getUserIdAndUser(req);

		//check if user is a verified purchase of the product
		//i.e check if user has purchased product before and that the product has been delivered
		const orderExists = await findOrder(userId, productId);

		//check if user has reviewed product before

		const newReview = await findProductReview(
			userId,
			productId,
			rating,
			review,
			session
		);

		//update product rating and review
		await Product.findByIdAndUpdate(
			{
				_id: new mongoose.Types.ObjectId(productId),
			},
			//add review to reviews array
			{
				$push: {
					reviews: newReview._id,
				},
			},
			{ session }
		);
		// Send Shop owner Notification
		const shop = await Shop.findOne({
			_id: productExists.shop,
		});
		const userService = req.userService;
		const shopUser = await checkUserById(
			shop.user,
			userService
		);
		await notificationService(
			"MotoPay",
			shopUser,
			"Product review",
			`Your product named ${productExists.productName} just got reviewed`
		);

		await session.commitTransaction();
		session.endSession();
		return res.send(
			successResponse(
				"Product reviewed successfully",
				newReview
			)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

export const testUploadBlodController = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// if (!req.file) {
		//   throw new NotFoundError("No file uploaded");
		// }

		const response = await uploadBlobService(req.file);
		console.log(response);
		return res.send(
			successResponse(
				"product uploaded successfully",
				response
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getDeliveryTime = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		await getUserIdAndUser(req);
		const { state, productId } =
			req.body as DeliveryTimeInput["body"];
		let deliveryTime;
		const product = await Product.findOne({
			_id: productId,
			status: ProductStatus.VERIFIED,
		});
		if (!product)
			throw new NotFoundError("Product not found");
		const shop = await Shop.findOne({
			_id: product.shop,
			status: StatusTypes.ACTIVE,
		});
		if (!shop) throw new NotFoundError("shop not found");

		const shopState = await State.findById(shop.state);
		if (!shopState)
			throw new NotFoundError("state is not found");

		if (shopState.name == state) {
			deliveryTime = "within 1-6 hours";
		} else {
			deliveryTime = "within 1-4 days";
		}
		return res.send(
			successResponse(
				"delivery time retrieved successfully",
				deliveryTime
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getAllAdminProductDealSections = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		await getUserIdAndUser(req);
		const adminSections = await AdminPLCategoryModel.find()
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
				"All product deal section fetch successfully",
				adminSections
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getAdminProductDealSection = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		await getUserIdAndUser(req);
		const id = req.params.id;
		const adminSection =
			await AdminPLCategoryModel.findById(id)
				.populate({
					path: "categoryId",
					select: "_id name",
				})
				.populate({
					path: "subCategories.subCategoryId",
					select: "_id name",
				});
		if (!adminSection)
			throw new NotFoundError(
				"Admin product section not found"
			);
		return res.send(
			successResponse(
				"Single product deal section fetch successfully",
				adminSection
			)
		);
	} catch (error) {
		next(error);
	}
};

export const lowOnStockNotification = async () => {
	try {
		// get products low on stock
		const products = await Product.find({
			stockQuantity: { $lt: 2 },
		}).populate({
			path: "shop",
			select: "user",
		});
		// Extract User Ids
		const extractUserIdsPromise = products.map(
			async (product) => {
				const shop = await Shop.findById(product.shop);
				const userId = shop.user;
				// Retrieve user information for the shop owner
				const user = await userNotificationInfo(userId);
				// Construct the notification message
				const message = `Dear ${user.firstName},\n\nWe hope this message finds you well. We wanted to inform you that one of your products, ${product.productName}, is running low on stock. As of now, there are only ${product.stockQuantity} units left in inventory.\n\nPlease consider restocking this product to ensure uninterrupted availability for your customers.\n\n`;
				// Send the notification
				await notificationService(
					"MotoPay",
					user,
					`Low Stock Alert: ${product.productName}`,
					message
				);
			}
		);
		await Promise.all(extractUserIdsPromise);
	} catch (error) {
		console.log(error);
	}
};

export const noProductStockNotification = async () => {
	try {
		// get products low on stock
		const products = await Product.find({
			stockQuantity: 0,
		}).populate({
			path: "shop",
			select: "user",
		});
		// Extract User Ids
		const extractUserIdsPromise = products.map(
			async (product) => {
				const shop = await Shop.findById(product.shop);
				const userId = shop.user;
				// Retrieve user information for the shop owner
				const user = await userNotificationInfo(userId);
				// Construct the notification message
				const message = `Dear ${user.firstName},\n\nWe hope this message finds you well. We wanted to inform you that one of your products, ${product.productName}, has run out of stock and is currently unavailable for purchase. Please consider restocking this product to ensure continuous availability for your customers.`;
				// Send the notification
				await notificationService(
					"MotoPay",
					user,
					`Out of Stock Alert: ${product.productName}`,
					message
				);
			}
		);
		await Promise.all(extractUserIdsPromise);
	} catch (error) {
		console.log(error);
	}
};

//Product Review: Request product review after purchase, if a user didn’t drop a review.
export const reviewProductReminder = async () => {
	try {
		const orders = await Order.find({
			paymentStatus: "paid",
			deliveryStatus: "delivered",
		}).populate({
			path: "cartItem",
			populate: {
				path: "product",
				select: "stockQuantity productName",
			},
		});
		// const products = [];
		// orders.forEach((order) => {
		// 	                          //@ts-ignore
		// 	if (order.cartItem && order.cartItem.product) {
		// 		products.push(order.cartItem.product);
		// 	}
		// });
		console.log(orders);
	} catch (error) {
		console.log(error);
	}
};

export const getProductReviews = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		await getUserIdAndUser(req);
		const productId = req.params.id;
		const reviews = await Review.find({
			product: productId,
		});
		// Loop through reviews

		// Fetch user info and modify the response
		const modifiedReviews = await Promise.all(
			reviews.map(async (review) => {
				const { firstName, lastName } =
					await userNotificationInfo(review.user);

				return {
					_id: review._id,
					product: review.product,
					user: review.user,
					rating: review.rating,
					comment: review.review,
					createdAt: review.createdAt,
					firstName,
					lastName,
				};
			})
		);

		return res.send(
			successResponse(
				"Product reviews fetched successfully",
				modifiedReviews
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getProductReviewAnalysis = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting user id from auth token
		const { userId } = await getUserIdAndUser(req);
		const productId = req.params.id;

		// console.log("Fetching product with ID:", productId);

		const product = await Product.findById(productId);
		if (!product)
			throw new NotFoundError("Product not found");

		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});
		if (!shop)
			throw new NotFoundError("User has no active shop");

		if (product.shop.toString() !== shop._id.toString()) {
			throw new ValidationError(
				"You are not authorized to view this product review analysis"
			);
		}

		// console.log(
		// 	"Fetching reviews for product ID:",
		// 	productId
		// );

		const productReviews = await Review.find({
			product: productId,
		});

		if (productReviews.length === 0)
			return res.send(
				successResponse("Product has no reviews", null)
			);

		// Initialize arrays
		const reviews: string[] = [];
		const ratings: number[] = [];

		// Populate arrays
		for (const productReview of productReviews) {
			reviews.push(productReview.review);
			ratings.push(productReview.rating);
		}

		// console.log("Reviews and ratings fetched:", {
		// 	reviews,
		// 	ratings,
		// });

		// Analyze the product reviews
		const analysisResult = await analyzeSentiment(
			reviews,
			ratings
		);

		// console.log("Analysis result:", analysisResult);

		// Send the response
		return res.send(
			successResponse(
				"Product review analysis retrieved successfully",
				analysisResult
			)
		);
	} catch (error) {
		console.error(
			"Error in getProductReviewAnalysis:",
			error
		);
		next(error);
	}
};

const validateDuplicateRequest = async (
	userId: string,
	productName: string,
	brandName: string,
	moreInfo: string
) => {
	return await RequestProductModel.findOne({
		user: userId,
		productName: productName,
		brandName: brandName,
		moreInfo: moreInfo,
		status: "pending",
	});
};

export const requestProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);

		const {
			productName,
			brandName,
			duration,
			location,
			moreInfo,
			document,
		} = req.body as RequestProductInput["body"];

		const existingProductRequest =
			await validateDuplicateRequest(
				userId,
				productName,
				brandName,
				moreInfo
			);
		if (existingProductRequest) {
			return res
				.status(409)
				.send(
					successResponse(
						"We are currently addressing a similar product request you sent. Please submit a different one.",
						existingProductRequest
					)
				);
		}

		const newProductRequest = new RequestProductModel({
			user: userId,
			productName,
			brandName,
			duration,
			location,
			moreInfo,
			document,
		});

		await newProductRequest.save();

		return res.send(
			successResponse(
				"Product request submitted successfully",
				newProductRequest
			)
		);
	} catch (error) {
		next(error);
	}
};

export const viewProductRequests = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const getProductRequest =
			await RequestProductModel.find({
				user: userId,
			});

		if (getProductRequest.length == 0) {
			return res.send(
				successResponse(
					"User have no product requests",
					null
				)
			);
		}

		return res.send(
			successResponse(
				"Product request retrieved successfully",
				getProductRequest
			)
		);
	} catch (error) {
		next(error);
	}
};

export const viewProductRequest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const id = req.params.id;
		const getProductRequest =
			await RequestProductModel.findOne({
				user: userId,
				_id: id,
			});

		if (!getProductRequest)
			throw new NotFoundError("Product request not found");

		return res.send(
			successResponse(
				"Single product request retrieved successfully",
				getProductRequest
			)
		);
	} catch (error) {
		next(error);
	}
};
