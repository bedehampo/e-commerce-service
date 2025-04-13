import { NextFunction, Response } from "express";
import { successResponse } from "../helpers";
import { checkUserById } from "../middlewares/validators";
import { Product } from "../model/shop/product";
import { WishList } from "../model/shop/wishlist";
import { CustomRequest } from "../utils/interfaces";
import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from "../errors";
import { Shop } from "../model/shop/shop";
import { ProductStatus } from "../types/shop";
import {
	buildWishlistProductQuery,
	findProducts,
	findShopByUserId,
	getUserIdAndUser,
} from "../services/product/productServices";
import { SubCategory } from "../model/admin/subCategory";
import { notificationService } from "../utils/global";

export const getProductsIndividually = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Verify user identity
		const { userId } = await getUserIdAndUser(req);
		// Get user wishlists
		const wishLists = await WishList.findOne({
			userId: userId,
		});
		// Verify wishlist existence
		if (!wishLists || wishLists.items.length === 0) {
			return res.send(
				successResponse(
					"No wishlist found for the user",
					[]
				)
			);
		}
		// Extract products from user wishlist
		const productPromise = wishLists.items.map(
			async (item) => {
				const product = await Product.findOne({
					_id: item,
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
				return product;
			}
		);
		const products = await Promise.all(productPromise);
		return res.send(
			successResponse(
				"WishList products retrieved successfully",
				products
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getAllUserWishlists = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Getting the user ID from the request
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		const wishlist = await WishList.findOne({
			userId: userId,
		});

		if (!wishlist || wishlist.items.length === 0) {
			return res.send(
				successResponse(
					"No wishlist found for the user",
					[]
				)
			);
		}

		const productPromise = wishlist.items.map(
			async (item) => {
				const product = await Product.findOne({
					_id: item,
				}).populate({
					path: "productCategory",
					select: "_id name",
				});
				return product;
			}
		);
		const products = await Promise.all(productPromise);

		//Group products by subCategories
		const productsBySubCategory = {};
		await Promise.all(
			products.map(async (product) => {
				if (product && product.productCategory) {
					const { _id } = product.productCategory;
					const subCategory = await SubCategory.findById(
						_id
					);
					const { name } = subCategory;
					if (!productsBySubCategory[name]) {
						productsBySubCategory[name] = {
							subCategoryName: name,
							wishListItems: [],
						};
					}
					productsBySubCategory[name].wishListItems.push(
						product
					);
				}
			})
		);

		const data = Object.values(productsBySubCategory).map(
			({ subCategoryName, wishListItems }) => ({
				subCategoryName,
				wishListItems,
			})
		);

		res.send(
			successResponse(
				"User wishlists fetched successfully",
				data
			)
		);
	} catch (error) {
		next(error);
	}
};

// Add a product to wishlist
export const addProductToWishlist = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const id = req.user && req.user.id;
		// check if user exists
		const userService = req.userService;
		const user = await checkUserById(id, userService);

		const { productId } = req.params;

		const product = await Product.findOne({
			_id: productId,
			status: ProductStatus.VERIFIED,
		});

		if (!product) {
			throw new NotFoundError("Product not found");
		}

		// ensure user doesn't add their own product to wishlist
		const shop = await Shop.findOne({
			_id: product.shop,
			user: id,
		});
		if (shop)
			throw new ValidationError(
				"user can't add own product to wishlist"
			);

		let wishlist = await WishList.findOne({
			userId: id,
		});

		if (!wishlist) {
			wishlist = new WishList({
				userId: id,
				items: [product],
			});
			await wishlist.save();
			// user.wishlists.push(wishlist._id);
		} else {
			const doesProductExist = wishlist.items.some((item) =>
				item._id.equals(productId)
			);

			if (doesProductExist) {
				throw new ConflictError(
					"Product already in wishlist"
				);
			}

			wishlist.items.push(product._id);
		}

		// await user.save();
		await wishlist.save();

		// send Notification to User
		await notificationService(
			"MotoPay",
			user,
			`Added product to wishlist`,
			`${product.productName} added to your wishlist`
		);

		res.send(
			successResponse(
				"Product added to wishlist successfully",
				wishlist
			)
		);
	} catch (error) {
		next(error);
	}
};

// Remove a product from wishlist
export const removeProductFromWishlist = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const id = req.user.id;
		// check if user exists
		const userService = req.userService;

		const user = await checkUserById(id, userService);
		const { productId } = req.params;

		const wishlist = await WishList.findOne({
			userId: id,
		});

		if (!wishlist) {
			throw new NotFoundError("Wishlist not found");
		}

		const productIndex = wishlist.items.findIndex((item) =>
			item._id.equals(productId)
		);

		if (productIndex === -1) {
			throw new NotFoundError(
				"Product not found in wishlist"
			);
		}

		wishlist.items.splice(productIndex, 1);
		await wishlist.save();

		// const userIndex = user.wishlists.findIndex((listId) =>
		//   listId.equals(wishlist._id)
		// );

		// if (userIndex !== -1) {
		//   user.wishlists.splice(userIndex, 1);
		//   await user.save();
		// }

		// send Notification to User
		await notificationService(
			"MotoPay",
			user,
			`Removed product to wishlist`,
			`Product removed from wishlist successfully`
		);

		res.send(
			successResponse(
				"Product removed from wishlist successfully",
				wishlist
			)
		);
	} catch (error) {
		next(error);
	}
};

// get products related to user's wish list
export const relatedWishListProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const shop = await findShopByUserId(userId);

		let productsQuery = await buildWishlistProductQuery(
			req.query,
			userId,
			shop
		);

		const relatedProducts = await findProducts(
			productsQuery.query,
			productsQuery.options
		);

		return res.send(
			successResponse(
				"Related wishlist products fetched successfully",
				relatedProducts
			)
		);
	} catch (error) {
		next(error);
	}
};
