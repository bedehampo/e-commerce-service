import { NextFunction, Response } from "express";
import { CustomRequest } from "../utils/interfaces";
import { successResponse } from "../helpers";
import { nanoid } from "nanoid";
import {
	AddToCartInput,
	ComputeSelectedCartTotalsInput,
	RemoveFromCartInput,
	UpdateCartQuantityInput,
} from "../validation/cart.schema";
import mongoose from "mongoose";
import { NotFoundError, ValidationError } from "../errors";
import { Product } from "../model/shop/product";
import { CartItem } from "../model/shop/cartItem";
import { Shop } from "../model/shop/shop";
import { CartItemStatus, ICartItem } from "../types/order";
import {
	checkUserById,
	checkUserByIdNew,
} from "../middlewares/validators";
import { Colour } from "../model/color";
import {
	generateUniqueSku,
	notificationService,
	promotionalProductNotification,
	userNotificationInfo,
} from "../utils/global";
import cron from "node-cron";
import {
	lowOnStockNotification,
	noProductStockNotification,
} from "./productsController";
import {
	lowDealStock,
	noDealStock,
} from "./dealController";
import { deleteBNPLSummaries } from "./bnpl.controller";
import { getUserIdAndUser } from "../services/product/productServices";

export const addToCart = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const data = req.body;
	const userId = req.user?.id;
	const userService = req.userService;
	const user = await checkUserById(userId, userService);

	const {
		colorId,
		product,
		quantity,
		selected_variations,
	} = data as AddToCartInput["body"];
	const session = await mongoose.startSession();

	try {
		session.startTransaction();

		const productData = await Product.findById(product);

		if (!productData) {
			throw new NotFoundError("Product not found");
		}

		// Find the selected color image by colorId
		const selectedImage = productData.productImages.find(
			(image) => image.color._id.toString() === colorId
		);

		if (!selectedImage) {
			throw new NotFoundError("Selected color not found");
		}

		// Prevent user from adding their own product to the cart
		const usersShop = await Shop.findOne({ user: userId });

		if (
			usersShop &&
			usersShop._id.toString() ===
				productData.shop.toString()
		) {
			throw new NotFoundError(
				"You cannot add your own product to cart"
			);
		}

		// Remove the userId from the product's views array
		await Product.updateOne(
			{ _id: productData._id },
			{ $pull: { views: userId } }
		);

		// Create the cart item payload
		const cartItemPayload = {
			product: productData._id,
			amount: productData.productPrice,
			user: userId,
			shop: productData.shop,
			selected_variations: selected_variations || [], // Ensure it's always an array
			selectColorImage: selectedImage,
			quantity: quantity,
		};

		// Find existing cart items for the user with the same product, color, and shop
		const existingCartItems = await CartItem.find({
			user: userId,
			product: productData._id,
			"selectColorImage.color": new mongoose.Types.ObjectId(
				colorId
			),
			status: "active",
			amount: productData.productPrice,
			shop: productData.shop,
		});

		// Find the cart item with matching selected variations (or no variations)
		let exactMatchItem = null;
		let newCartItem = null;

		if (existingCartItems.length > 0) {
			// If no variations are provided in the payload
			if (
				!selected_variations ||
				selected_variations.length === 0
			) {
				// Find an existing item with no variations
				exactMatchItem = existingCartItems.find(
					(item) => item.selected_variations.length === 0
				);
			} else {
				// Variations are provided, so check for an exact match
				exactMatchItem = existingCartItems.find(
					(item) =>
						item.selected_variations.length ===
							selected_variations.length &&
						item.selected_variations.every(
							(variation, index) =>
								variation.name ===
									selected_variations[index].name &&
								variation.value ===
									selected_variations[index].value
						)
				);
			}
		}

		// If exact match is found, increase quantity, otherwise create a new cart item
		if (exactMatchItem) {
			exactMatchItem.quantity += quantity; // Increment by the specified quantity
			await exactMatchItem.save();
		} else {
			// No matching item, create a new cart item
			newCartItem = new CartItem(cartItemPayload);
			await newCartItem.save();
		}

		// Calculate the total number of items in the cart
		const totalItemCount = await sumTotalItemsInCart(
			userId
		);

		// Commit the transaction and end the session
		await session.commitTransaction();
		session.endSession();

		// Return success response
		return res.send(
			successResponse(
				exactMatchItem
					? "Cart updated successfully"
					: "Added to cart",
				{
					totalItemCount,
					cartItemId:
						exactMatchItem?._id || newCartItem?._id, // Return the cart item ID
				}
			)
		);
	} catch (error) {
		// Abort the transaction in case of an error
		if (session.inTransaction()) {
			await session.abortTransaction();
		}
		session.endSession();
		next(error);
	}
};

export const updateCartItemQuantity = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const { action } =
		req.body as UpdateCartQuantityInput["body"];
	const { cartItemId } = req.params;
	const userId = req.user?.id;
	const userService = req.userService;
	const user = await checkUserById(userId, userService);
	const session = await mongoose.startSession();

	try {
		session.startTransaction();

		// Find the cart item by ID and user ID to ensure it's the user's cart item
		const cartItem = await CartItem.findOne({
			_id: cartItemId,
			user: userId,
			status: "active",
		});

		if (!cartItem) {
			throw new NotFoundError("Cart item not found");
		}

		// Perform increment or decrement based on the action
		if (action === "increment") {
			cartItem.quantity += 1;
		} else if (action === "decrement") {
			cartItem.quantity -= 1;

			// If the quantity reaches zero, remove the item
			if (cartItem.quantity <= 0) {
				await CartItem.deleteOne({ _id: cartItemId });
				await session.commitTransaction();
				session.endSession();

				// Get the updated total item count after removal
				const totalItemCount = await sumTotalItemsInCart(
					userId
				);

				return res.send(
					successResponse("Item removed from cart", {
						totalItemCount,
					})
				);
			}
		} else {
			throw new ValidationError("Invalid action");
		}

		// Save the updated cart item
		await cartItem.save();

		// Get the total item count after updating the cart
		const totalItemCount = await sumTotalItemsInCart(
			userId
		);

		await session.commitTransaction();
		session.endSession();

		return res.send(
			successResponse("Cart updated successfully", {
				totalItemCount,
				cartItemId: cartItem._id,
				quantity: cartItem.quantity,
			})
		);
	} catch (error) {
		if (session.inTransaction()) {
			await session.abortTransaction();
		}
		session.endSession();
		next(error);
	}
};

export const removeFromCart = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const data = req.params;
		const query = req.query;
		const { type } = query as RemoveFromCartInput["query"];
		const userId = req.user && req.user.id;
		const { cartItemId } =
			data as RemoveFromCartInput["params"];

		// check if user exists
		const userService = req.userService;
		const user = await checkUserById(userId, userService);

		const cartItem = await CartItem.findOne({
			_id: cartItemId,
			user: userId,
		});

		if (!cartItem) {
			throw new NotFoundError("Cart item not found");
		}

		if (cartItem.quantity > 1 && type === "one") {
			cartItem.quantity -= 1;
			await cartItem.save();
			return res.send(
				successResponse(
					"Product item removed from cart successfully",
					null
				)
			);
		}

		await CartItem.findByIdAndDelete(cartItemId);

		// await notificationService(
		// 	"MotoPay",
		// 	user,
		// 	`Removed from cart`,
		// 	`You have successfully removed a product from your cart`
		// );

		// user.cart = user.cart.filter(
		//   (item) => item.toString() !== cartItemId.toString()
		// );

		// await user.save();

		return res.send(
			successResponse(
				"Product removed from cart successfully",
				null
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getCart = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;

		const user = await checkUserById(userId, userService);
		// console.log(user);
		// check if user exists
		const cart = await CartItem.find({
			user: userId,
			status: CartItemStatus.ACTIVE,
		})
			.populate({
				path: "product",
				model: Product,
				select: "-productImages -variations",
			})
			//populate color
			.populate({
				path: "selectColorImage.color",
				model: Colour,
				select: "name",
			})
			.sort({ createdAt: -1 })
			.exec();

		//calculate subtotal of cart items and total discount

		let subTotal = 0;
		let totalDiscount = 0;

		cart.forEach((item) => {
			//@ts-ignore
			subTotal += item.amount * item.quantity;

			totalDiscount += //@ts-ignore
				item.product.discountAmount * item.quantity;
		});

		return res.send(
			successResponse("Cart retrieved successfully", {
				cart: cart,
				subTotal,
				totalDiscount,
				shipping: 0,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const computeSelectedCartTotals = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;

		const user = await checkUserById(userId, userService);
		const { cartItemIds } =
			req.body as ComputeSelectedCartTotalsInput["body"];

		if (cartItemIds.length === 0) {
			return res.send(
				successResponse(
					"Cart total retrieved successfully",
					{
						cart: [],
						subTotal: 0,
						totalDiscount: 0,
						shipping: 0,
					}
				)
			);
		}
		const cart = await CartItem.find({
			user: userId,
			status: CartItemStatus.ACTIVE,
			_id: { $in: cartItemIds },
		})
			.populate({
				path: "product",
				model: Product,
				select: "-productImages -variations",
			})
			.sort({ createdAt: -1 })
			.exec();

		let subTotal = 0;
		let totalDiscount = 0;

		cart.forEach((item) => {
			//@ts-ignore
			subTotal += item.amount * item.quantity;
			//@ts-ignore
			totalDiscount +=
				//@ts-ignore
				item.product.discountAmount * item.quantity;
		});
		return res.send(
			successResponse("Cart total retrieved successfully", {
				cart: cart,
				subTotal,
				totalDiscount,
				shipping: 0,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const clearCart = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;

		// check if user exists
		const userService = req.userService;

		const user = await checkUserById(userId, userService);
		await CartItem.deleteMany({
			user: userId,
			status: CartItemStatus.ACTIVE,
		});

		// await notificationService(
		// 	"MotoPay",
		// 	user,
		// 	`Cleared cart`,
		// 	`You have successfully cleared  your cart`
		// );

		return res.send(
			successResponse("Cart cleared successfully", null)
		);
	} catch (error) {
		next(error);
	}
};

// const generateUniqueSku = async () => {
// 	let sku;
// 	let isUnique = false;

// 	while (!isUnique) {
// 		sku = nanoid(10);
// 		const existingProduct = await Product.findOne({ sku });
// 		if (!existingProduct) {
// 			isUnique = true;
// 		}
// 	}

// 	return sku;
// };

// const addSku = async () => {
// 	try {
// 		// Fetch all products that don't have an SKU
// 		const products = await Product.find({
// 			sku: { $exists: false },
// 		});

// 		for (const product of products) {
// 			const sku = await generateUniqueSku();
// 			product.sku = sku;
//       console.log("worked well")
// 			await product.save();
// 		}

// 		console.log("SKUs added to all products successfully.");
// 	} catch (error) {
// 		console.error("Error adding SKUs:", error);
// 	}
// };

const sumTotalItemsInCart = async (userId: number) => {
	let totalItemCount: number = 0;
	const cartItemCount = await CartItem.aggregate([
		{
			$match: {
				user: userId,
				status: CartItemStatus.ACTIVE,
			},
		},
		{
			$group: {
				_id: null,
				count: {
					$sum: "$quantity",
				},
			},
		},
	]);

	if (cartItemCount.length > 0) {
		totalItemCount = cartItemCount[0].count;
	}
	return totalItemCount;
};

const checkAbandonCart = async () => {
	const daysAgo = new Date();
	daysAgo.setDate(daysAgo.getDate() - 1);

	const expiredCartItems = await CartItem.find({
		createdAt: { $lte: daysAgo },
	});

	for (const cartItem of expiredCartItems) {
		const user = await userNotificationInfo(cartItem.user);
		if (user) {
			const message = `Hello ${user.firstName},\nWe noticed that you have some items waiting in your cart on MotoPay. Don't miss out on them!\n
			Remember, these items won't stay in your cart forever. Complete your purchase now to make them yours!\n
			If you have any questions or need assistance, feel free to reach out to us. Happy shopping!`;
			await notificationService(
				"MotoPay",
				user,
				`Time to Checkout: Your Cart Awaits!`,
				message
			);
		}
	}
};

// async function dropUniqueIndex() {
// 	try {
// 		const collectionName = "userDeliveryAddresses"; // Collection Name
// 		const indexName = "addresses.deliveryAddress_1"; // Index Name

// 		// Ensure Mongoose is connected
// 		if (mongoose.connection.readyState !== 1) {
// 			throw new Error("Mongoose is not connected");
// 		}

// 		// Drop the unique index
// 		const result = await mongoose.connection.db
// 			.collection(collectionName)
// 			.dropIndex(indexName);
// 		console.log(`Index ${indexName} dropped:`, result);
// 	} catch (error) {
// 		console.error("Error dropping index:", error);
// 	}
// }

// Function to update all products with a new SKU
// const updateAllProductsWithSku = async () => {
// 	try {
// 		// Fetch all products
// 		const products = await Product.find();

// 		for (const product of products) {
// 			// Generate a unique SKU
// 			const sku = await generateUniqueSku(product._id);

// 			// Update the product with the new SKU
// 			product.sku = sku;

// 			// Save the product
// 			await product.save();
// 		}

// 		console.log("SKUs added to all products successfully.");
// 	} catch (error) {
// 		console.error("Error adding SKUs:", error);
// 	}
// };

// Schedule the cron job to run every 24 hours (1 day)
cron.schedule("0 0 * * *", async () => {
	// await checkAbandonCart();
	//   await lowOnStockNotification();
	//   await noProductStockNotification();
	// await noDealStock();
});

// Schedule the cron job to run every 2 days
cron.schedule("0 0 */2 * *", async () => {
	// await checkAbandonCart();
	// await lowDealStock();
});

// Schedule the cron job to run every 7 days
cron.schedule("0 0 */7 * *", async () => {
	// await checkAbandonCart();
	//  await promotionalProductNotification("festive-deals");
});

// Schedule the cron job to run every minute
cron.schedule("* * * * *", async () => {});

// 24hrs
// 1day
// 2day
// 7days

// The endpoint to be executed by the cron job
// export const abandonCartReminder = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const ans = await checkAbandonCart();

// 		return res.send(
// 			successResponse(
// 				"Abandon cart reminder executed successfully",
// 				ans
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };
