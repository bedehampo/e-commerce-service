import { NextFunction, Response } from "express";
import {
	ConflictError,
	NotFoundError,
	ServiceError,
	ValidationError,
} from "../errors";
import { successResponse } from "../helpers";
import { Shop } from "../model/shop/shop";
import {
	BusinessWalletType,
	CustomRequest,
	StatusTypes,
} from "../utils/interfaces";
import {
	AdjustPriceInput,
	CreateShopInput,
	FilterShopInput,
	UpdateShopContactInfoInput,
	UpdateShopDescInput,
	UpdateShopInput,
	UpdateShopLocationInput,
	UpdateShopNameInput,
	amountSuggestInput,
	sendShopInviteInput,
	shopBgInput,
	shopDPInput,
} from "../validation/shop.schema";
// import { CreateCategoryInput } from "../validation/createCategory.schema";
import mongoose, { Types } from "mongoose";
import { checkUserById } from "../middlewares/validators";
// import { User } from "../model/User";
import { Category } from "../model/admin/category";
import { Product } from "../model/shop/product";
import { ShopList } from "../model/shop/shoplist";
import { State } from "../model/shop/state";
import { WishList } from "../model/shop/wishlist";

import {
	analyzeSentiment,
	calculatePercentageDifference,
	getSalesCount,
	getStatsYear,
	getUserTransactions,
	notificationService,
	shopSettleTransactions,
	shopTransactionRecords,
	shopUnsettleTransactions,
	userNotificationInfo,
	validatePin,
} from "../utils/global";
// import { NewCategory } from "../model/admin/newCategory";
import { SubCategory } from "../model/admin/subCategory";
import { recordShopVisit } from "../services/shop/shopVisitRecords";
import { ShopPermission } from "../model/shop/shopPermission";
import { ShopMember } from "../model/shop/shopMembers";
import { TypeOf } from "zod";
import { ProductStatus } from "../types/shop";
import { uploadBlobService } from "../services/UploadService";
import { TransactionStatusCode } from "../types/transactions";
import { get, identity, truncate } from "lodash";
import { ShopSelfHelp } from "../model/admin/shopSelfHelp";
import { Colour } from "../model/color";
import { basicColors } from "../utils/colorBox";
import {
	getUserIdAndUser,
	saveShopAction,
} from "../services/product/productServices";
import { UserServiceStatus } from "../types/user";
import { Review } from "../model/shop/Review";
import { Order } from "../model/shop/order";
import {
	OrderDeliveryStatus,
	OrderPaymentStatus,
	OrderStatus,
} from "../types/order";
import { DisputeModel } from "../model/shop/dispute";
import { checkShopPermission } from "../middlewares/checkShopPermission";
import { ShopAction } from "../model/shop/shopActions";
import { ReturnProductModel } from "../model/shop/returnProduct";
import { startOfWeek } from "date-fns";
import { UnauthorizedError } from "express-jwt";
import { SendEnquiryInput } from "../validation/createCategory.schema";
import { VendorEnquiryType } from "../model/admin/VendorEnquiryType";
import { VendorEnquiryReason } from "../model/admin/vendorEnquiryReason";
import { Enquiry } from "../model/shop/Enquiry";
import {
	AdminShopFAQGroupModel,
	VendorEnquiryGroup,
} from "../model/admin/vendorEnquiry";

// const colorNameList: any = require("color-name-list");

export const getUserBasicInfo = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { user } = await getUserIdAndUser(req);
		return res.send(
			successResponse(
				"User basic info fetched successfully",
				{
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					mobileNumber: user.mobileNumber,
					email: user.email,
				}
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getShops = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const shops = await Shop.find().populate({
			path: "category",
			select: "_id title",
		});
		return res.send(
			successResponse("Shops fetched successfully", shops)
		);
	} catch (error) {
		next(error);
	}
};

export const getShop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;

		// Find the shop associated with the user
		const shop = await Shop.findOne({
			user: userId,
			status: {
				$in: [
					StatusTypes.ACTIVE,
					StatusTypes.INACTIVE,
					StatusTypes.SUSPENDED,
				],
			},
		})
			.select("-adminAction -products")
			.populate({ path: "category", select: "_id name" })
			.populate({ path: "state", select: "_id name" })
			.lean();

		if (!shop) {
			throw new NotFoundError("You don't have a shop");
		}

		const { _id: shopId, status } = shop;

		if (status !== StatusTypes.ACTIVE) {
			throw new ValidationError(
				`Your shop is currently ${status}`
			);
		}

		// Get sales count for the shop
		const salesCountRes = await getSalesCount(shopId);
		const totalSales =
			salesCountRes.length > 0
				? salesCountRes[0].totalSales
				: 0;

		// Get followers quantity
		const followersCount = shop.followers.length;

		// Construct response
		const response = {
			...shop,
			salesCount: totalSales,
			noOfFollowers: followersCount,
		};

		// Send success response with shop details
		return res.send(
			successResponse("Shop fetched successfully", response)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleShop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.id;

		// record user shop visit
		await recordShopVisit(shopId, userId);
		// Get a single shop
		const shop = await Shop.findOne({
			_id: shopId,
			status: StatusTypes.ACTIVE,
			user: { $ne: userId },
		}).lean();

		// .select(
		// 		"-_id -user -official_email -official_phone_number -emailOn -pushNotifications -commentsOn -shopLogoName -adminAction -shop_disputes -shopMembers -enableEmailNotification -createdAt -updatedAt -shopVisitCount"
		// 	)

		if (!shop) throw new NotFoundError("Shop not found");

		const salesCountRes = await getSalesCount(shop._id);
		// Check if salesCountRes has data before accessing totalSales
		const totalSales =
			salesCountRes && salesCountRes.length > 0
				? salesCountRes[0].totalSales
				: 0;

		// Get followers quantity
		const followersCount = shop.followers.length;
		console.log(followersCount);

		const response = {
			...shop,
			salesCount: totalSales,
			noOfFollowers: followersCount,
		};

		return res.send(
			successResponse("Shop fetched successfully", response)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteShop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const userId = req.user && req.user.id;

		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});
		if (!shop) {
			throw new NotFoundError("User has no active shop");
		}

		// Update shop status to 'DELETED'
		const updatedShop = await Shop.findByIdAndUpdate(
			shop._id,
			{ status: StatusTypes.DELETED },
			{ new: true, session }
		);

		// Update user's shop status
		const userService = req.userService;
		const response =
			await userService.updateUsersShopStatus(0);
		if (response.status !== UserServiceStatus.SUCCESSFUL) {
			throw new ServiceError(
				`Failed to update user's shop status: ${response.message}`
			);
		}

		// Commit the transaction
		await session.commitTransaction();
		session.endSession();

		return res.send(
			successResponse(
				"Shop deleted successfully",
				updatedShop
			)
		);
	} catch (error) {
		// Abort transaction on error
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

export const filterShops = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const data = req.body as FilterShopInput["body"];
		const { name, category, location } = data;
		const userId = req.user && req.user.id;

		const doesUserHaveShop = await Shop.findOne({
			user: userId,
		});

		const makeFilterConditions = (
			params: FilterShopInput["body"]
		) => {
			const ands = [];

			if (params.name)
				ands.push({
					brand_name: {
						$regex: params.name,
						$options: "i",
					},
				});

			if (params.category)
				ands.push({
					category: new mongoose.Types.ObjectId(
						params.category
					),
				});

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
		const ands = makeFilterConditions(data);
		const match = { $and: ands };
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
		if (ands.length > 0) {
			pipeline.push({ $match: match });
		}

		pipeline = [
			...pipeline,
			{
				$match: {
					$and: [
						{
							user: {
								$ne: new mongoose.Types.ObjectId(userId),
							},
						},
						{ status: { $ne: StatusTypes.DELETED } },
					],
				},
			},
			{
				$lookup: {
					from: "orders",
					localField: "_id",
					foreignField: "shop",
					as: "sales",
				},
			},
			{
				$addFields: {
					totalSales: { $size: "$sales" },
				},
			},
			{
				$project: {
					sales: 0, // Remove the sales array from the output
				},
			},
		];

		let results = await Shop.aggregate(
			pipeline
		).allowDiskUse(true);

		// Fetch sales count for each shop separately and add it to the results
		for (let shop of results) {
			const shopId = shop._id.toString();
			const salesCount = await getSalesCount(shopId);
			const totalSales =
				salesCount && salesCount.length > 0
					? salesCount[0].totalSales
					: 0;

			shop.totalSales = totalSales;

			// Convert distance from meters to kilometers
			if (shop.dist && shop.dist.calculated) {
				shop.dist.calculatedKm =
					shop.dist.calculated / 1000;
			}
		}

		return res.send(
			successResponse("Shops fetched successfully", results)
		);
	} catch (error) {
		next(error);
	}
};

export const createshop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	console.log("start of createshop");

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const data = req.body as CreateShopInput["body"];
		const { userId } = await getUserIdAndUser(req);
		console.log("userId", userId);

		const {
			logoImageUrl,
			category,
			brand_name,
			address,
			official_email,
			description,
			official_phone_number,
			latitude,
			longitude,
			state,
			lga,
			landMark,
		} = data;

		// Check if the user already has a shop
		const existingShop = await Shop.findOne({
			user: userId,
			status: {
				$in: [
					StatusTypes.ACTIVE,
					StatusTypes.INACTIVE,
					StatusTypes.SUSPENDED,
				],
			},
		}).session(session);

		if (existingShop) {
			throw new ConflictError(
				`You already have a shop. status: ${existingShop.status}`
			);
		}

		// Check if a shop with the same brand name already exists (excluding deleted shops)
		const shopExists = await Shop.findOne({
			brand_name,
			status: { $ne: StatusTypes.DELETED },
		}).session(session);

		if (shopExists) {
			throw new ConflictError(
				"A shop with that brand name already exists"
			);
		}

		// Check if the shop category exists
		const categoryExists = await Category.findById(
			category
		).session(session);

		if (!categoryExists) {
			throw new NotFoundError("Category does not exist");
		}

		// Validate state and LGA
		const stateExists = await State.findById(state).session(
			session
		);

		if (!stateExists) {
			throw new NotFoundError("State not found");
		}

		if (!stateExists.lgas.includes(lga)) {
			throw new NotFoundError("LGA not found");
		}

		// Create the shop
		const shop = new Shop({
			user: userId,
			description,
			logoImageUrl,
			brand_name,
			official_email,
			official_phone_number,
			category,
			location: {
				type: "Point",
				coordinates: [Number(longitude), Number(latitude)],
			},
			address,
			state,
			lga,
			landMark,
		});

		console.log("shop created");

		//update user has shop to true
		const userService = req.userService;
		const response =
			await userService.updateUsersShopStatus(1);
		if (response.status !== UserServiceStatus.SUCCESSFUL) {
			throw new ServiceError(`Error: ${response.message}`);
		}

		await shop.save({ session });
		await session.commitTransaction();
		session.endSession();

		return res.send(
			successResponse("Shop created successfully", shop)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

export const updateShop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const data = req.body as UpdateShopInput["body"];
		const shopExists = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});
		if (!shopExists) {
			throw new ConflictError("Shop exists");
		}
		// 		// validate state and lga
		if (data.state) {
			const stateExit = await State.findById(data.state);
			if (!stateExit)
				throw new NotFoundError("state not found");
			if (data.lga) {
				const lgaExit = stateExit.lgas.includes(data.lga);
				if (!lgaExit)
					throw new NotFoundError("lga not found");
			}
		}

		console.log(data);

		const shop = await Shop.findOneAndUpdate(
			{ _id: shopExists._id },
			{ $set: data },
			{ new: true, upsert: true }
		);

		console.log(shop);

		return res.send(
			successResponse("Shop updated successfully", shop)
		);
	} catch (error) {
		next(error);
	}
};

export const updateShopLocation = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const { latitude, longitude } =
			req.body as UpdateShopLocationInput["body"];

		if (
			typeof latitude !== "number" ||
			typeof longitude !== "number"
		) {
			throw new ValidationError(
				"Latitude and longitude must be numbers"
			);
		}

		const shop = await Shop.findOneAndUpdate(
			{ user: userId, status: StatusTypes.ACTIVE },
			{
				$set: {
					"location.coordinates": [longitude, latitude],
				},
			},
			{ new: true }
		);

		if (!shop) {
			throw new NotFoundError("Shop not found");
		}

		return res.send(
			successResponse(
				"Shop location updated successfully",
				shop
			)
		);
	} catch (error) {
		next(error);
	}
};

export const createShopList = async (
	req: any,
	res: Response,
	next: NextFunction
) => {
	try {
		// getting the id from the params
		const userId = req.user && req.user.id;

		// getting the properties from the user
		let { name } = req.body;

		// checking if all properties are present
		if (!name)
			throw new ValidationError("field are required");

		// finding the user by id
		const userService = req.userService;
		await checkUserById(userId, userService);

		// checking if the user has a shop
		const userShop = await Shop.findOne({
			user: userId,
			status: { $ne: StatusTypes.DELETED },
		});
		if (!userShop)
			throw new NotFoundError("User does not have a shop");

		// checking for existing shop list
		const existingShoplist = await ShopList.findOne({
			name,
		});

		if (existingShoplist)
			throw new ValidationError("Shop list already exists");

		// creating a shop list
		const shopList = new ShopList({
			shopId: userShop._id,
			name: name.toLowerCase(),
		});
		// saving the shop list
		await shopList.save();

		// updating the user shop list
		// userShop.shop_listings.push(shopList._id);
		await userShop.save();
		return res.send(
			successResponse("Shop list created", shopList)
		);
	} catch (error) {
		next(error);
	}
};

export const updateShopList = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const currentUserId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(currentUserId, userService);

		const { shoplistID } = req.params;
		const shopList = await ShopList.findById(shoplistID);

		if (!shopList) {
			throw new NotFoundError("Shop list not found");
		}

		const { name } = req.body;
		if (!name) {
			throw new ValidationError("Name is required");
		}

		const updatedShopList =
			await ShopList.findByIdAndUpdate(
				shoplistID,
				{ name: name.toLowerCase() },
				{ new: true }
			);

		return res.send(
			successResponse("Shop list updated", updatedShopList)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteShopList = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const currentUserId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(currentUserId, userService);

		const { shoplistID } = req.params;

		const shop = await Shop.findOne({
			user: currentUserId,
			//status not deleted
			status: { $ne: StatusTypes.DELETED },
		});

		if (!shop) {
			throw new NotFoundError("User has no shop");
		}
		await ShopList.findByIdAndDelete({
			_id: shoplistID,
			shopId: shop._id,
		});

		await Shop.findByIdAndUpdate(shop._id, {
			$pull: { shop_listings: shoplistID },
		});

		await Product.updateMany(
			{ shop_list: shoplistID },
			{ $unset: { shop_list: 1 } }
		);

		return res.send(
			successResponse(
				"Shop list deleted successfully",
				null
			)
		);
	} catch (error) {
		next(error);
	}
};

export const addShopListToProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const currentUserId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(currentUserId, userService);
		const { shoplistID, productID } = req.body;
		if (!shoplistID || !productID)
			throw new ValidationError("All fields are required");
		const shop = await Shop.findOne({
			user: currentUserId,
			//status not deleted
			status: { $ne: StatusTypes.DELETED },
		});
		if (!shop) {
			throw new NotFoundError("User has no shop");
		}
		const product = await Product.findOne({
			_id: productID,
			shop: shop._id,
		});
		const shopList = await ShopList.findOne({
			_id: shoplistID,
			shopId: shop._id,
		});
		if (!product)
			throw new NotFoundError("Product not found");
		if (!shopList)
			throw new NotFoundError("Shop list not found");
		// check if the shoplist is already added to the product
		const productHasShoplist = await Product.findOne({
			_id: productID,
			shop_list: shoplistID,
		});
		if (productHasShoplist)
			throw new ValidationError(
				"Shop list already added to product"
			);
		await product.updateOne({
			shop_list: shoplistID,
		});
		await product.save();
		const updatedResult = await Product.findOne({
			_id: productID,
			shop_list: shoplistID,
		});

		return res.send(
			successResponse(
				"Shop list added to product successfully",
				updatedResult
			)
		);
	} catch (error) {
		next(error);
	}
};

export const removeShopListFromProduct = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const currentUserId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(currentUserId, userService);

		const { shoplistID, productID } = req.body;
		if (!shoplistID || !productID) {
			throw new ValidationError("All fields are required");
		}

		const shop = await Shop.findOne({
			user: currentUserId,
			//status not deleted
			status: { $ne: StatusTypes.DELETED },
		});
		if (!shop) {
			throw new NotFoundError("User has no shop");
		}
		const product = await Product.findOne({
			_id: productID,
			shop: shop._id,
		});

		const shopList = await ShopList.findOne({
			_id: shoplistID,
			shopId: shop._id,
		});

		if (!product) {
			throw new NotFoundError("Product not found");
		}

		if (!shopList) {
			throw new NotFoundError("Shop list not found");
		}

		const productHasShoplist = await Product.findOne({
			_id: productID,
			shop_list: shoplistID,
		});

		if (!productHasShoplist) {
			throw new NotFoundError(
				"Shop list is not added to the product"
			);
		}

		await productHasShoplist.updateOne({
			shop_list: null,
		});

		await productHasShoplist.save();

		const updateProduct = await Product.findOne({
			_id: productID,
		});

		return res.send(
			successResponse(
				"Shop list removed from product successfully",
				updateProduct
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopLists = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const currentUserId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(currentUserId, userService);
		const shop = await Shop.findOne({
			user: currentUserId,
		});
		const shopLists = await ShopList.find({
			shopId: shop._id,
		}).select("name _id");
		return res.send(
			successResponse(
				"Shop lists fetched successfully",
				shopLists
			)
		);
	} catch (error) {
		next(error);
	}
};

export const updateCategory = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		res.send(id);
		const data = req.body as UpdateShopInput["body"];
		const shopUpdate = await Shop.findByIdAndUpdate(
			id,
			data,
			{
				new: true,
			}
		);
		return res.send(
			successResponse(
				"Shop updated successfully",
				shopUpdate
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getCategories = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const categories = await Category.find().populate(
			"subCategories"
		);

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


// get all product of a shop
export const getLoggedInUserShopProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const currentUserId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(currentUserId, userService);

		const shop = await Shop.findOne({
			user: currentUserId,
			status: StatusTypes.ACTIVE,
		});

		if (!shop) throw new NotFoundError("Shop not found");

		const products = await Product.find({
			shop: shop._id,
			status: {
				$in: [
					ProductStatus.VERIFIED,
					ProductStatus.OUT_OF_STOCK,
				],
			},
		});
		return res.send(successResponse("Products", products));
	} catch (error) {
		next(error);
	}
};

// follow and unfollow shop
export const followAndUnfollowShop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const { shopId } = req.params;

		const userService = req.userService;
		const user = await checkUserById(userId, userService);
		if (!user) throw new NotFoundError("User not found");

		const shop = await Shop.findById(shopId);
		if (!shop) throw new NotFoundError("Shop not found");

		//const shopFollowed = user.shop_followed.some((shop) => shop.equals(shopId));

		const shopFollowed = shop.followers.includes(userId);

		if (shopFollowed) {
			shop.followers = shop.followers.filter(
				(follower) => follower != userId
			);
			await shop.save();
		} else {
			shop.followers.push(userId);
			await shop.save();
		}

		const action = shopFollowed ? "unfollowed" : "followed";
		res.send(
			successResponse(
				`You have successfully ${action} this shop`,
				action
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getFollowedShops = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;

		const userService = req.userService;
		const user = await checkUserById(userId, userService);
		if (!user) throw new NotFoundError("User not found");

		//using mongoose aggregate get all shops where the followers field array contains the userId
		const shops = await Shop.aggregate([
			{
				$match: {
					followers: { $in: [userId] },
				},
			},
		]);

		return res.send(
			successResponse("Shops fetched successfully", shops)
		);
	} catch (error) {
		next(error);
	}
};

export const getStates = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const states = await State.find().sort({ name: 1 });
		return res.send(
			successResponse(
				"States retrieved successfully",
				states
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getLocalGovernments = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { stateId } = req.params;
		const state = await State.findById(stateId);
		if (!state) throw new NotFoundError("State not found");

		return res.send(
			successResponse(
				"Local governments retrieved successfully",
				state.lgas
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getInventory = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.shopId;

		//    check shop permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"view_inventory"
		);

		const shop = await Shop.findOne({
			_id: shopId,
			status: StatusTypes.ACTIVE,
		});

		if (!shop) {
			throw new NotFoundError("Shop not found");
		}

		const params = req.query;

		const pipeline: any[] = [
			{
				$match: {
					shop: new mongoose.Types.ObjectId(shop._id),
					status: {
						$in: [
							ProductStatus.VERIFIED,
							ProductStatus.OUT_OF_STOCK,
						],
					},
				},
			},
		];

		const ands = [];

		if (params.search) {
			ands.push({
				$or: [
					{
						productName: {
							$regex: params.search as string,
							$options: "i",
						},
					},
					{
						productDescription: {
							$regex: params.search as string,
							$options: "i",
						},
					},
				],
			});
		}

		if (params.subcategory) {
			pipeline.push({
				$lookup: {
					from: "subcategories",
					localField: "productCategory",
					foreignField: "_id",
					as: "subcategory",
				},
			});
			ands.push({
				"subcategory._id": new mongoose.Types.ObjectId(
					params.subcategory as string
				),
			});
		}

		if (ands.length > 0) {
			pipeline.push({
				$match: {
					$and: ands,
				},
			});
		}

		pipeline.push({
			$facet: {
				products: [
					{
						$project: {
							views: 0,
							customFields: 0,
						},
					},
				],
				totalStock: [
					{
						$group: {
							_id: null,
							totalStock: { $sum: "$stockQuantity" },
						},
					},
				],
				totalProducts: [
					{
						$group: {
							_id: null,
							count: { $sum: 1 },
						},
					},
				],
			},
		});

		const result = await Product.aggregate(pipeline);

		const inventory = result[0];

		inventory.totalStock =
			inventory.totalStock[0]?.totalStock || 0;
		inventory.totalProducts =
			inventory.totalProducts[0]?.count || 0;

		// //  save shop permission activities
		await saveShopAction(
			userId,
			"viewed Inventory.",
			shop._id.toString()
		);

		return res.send(
			successResponse("Inventory fetched", inventory)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopPermissions = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		// check if the user has an active shop
		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});

		if (!shop)
			throw new NotFoundError("an active shop not found");

		const permissions = await ShopPermission.find().select(
			"-createdAt -updatedAt -__v"
		);

		return res.send(
			successResponse("Permissions retrieve", permissions)
		);
	} catch (error) {
		next(error);
	}
};

// get shop permission
export const getShopPermission = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const permissionId = req.params.permissionId;
		// check if the user has an active shop
		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});

		if (!shop)
			throw new NotFoundError("an active shop not found");

		const permissions = await ShopPermission.findById(
			permissionId
		).select("-createdAt -updatedAt -__v");

		return res.send(
			successResponse("Permissions retrieve", permissions)
		);
	} catch (error) {
		next(error);
	}
};

// send a user shop membership invite
export const sendShopInvite = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Extract user detail from token
		const userService = req.userService;

		const { userId, user } = await getUserIdAndUser(req);

		// Extract payload from body
		const { inviteeIds, permissions, transactionPin } =
			req.body as sendShopInviteInput["body"];

		// Extract token from headers
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			throw new Error("Authorization token is required");
		}

		const accountNo = user.accountNumber;

		const pinValidationResponse = await validatePin(
			accountNo.toString(),
			transactionPin.toString(),
			token
		);

		// Handle response from pin validation
		if (pinValidationResponse.code !== "00") {
			throw new ValidationError("Incorrect pin");
		}

		// Get the sender's shop
		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});

		if (!shop) {
			throw new NotFoundError("An active shop not found");
		}

		// Check if the permissions exist in the shop permission model
		const permissionsExist = await ShopPermission.find({
			_id: { $in: permissions },
		});

		const notFoundPermissionIds = permissions.filter(
			(permissionId) =>
				!permissionsExist.some((p) =>
					p._id.equals(permissionId)
				)
		);

		if (notFoundPermissionIds.length > 0) {
			throw new NotFoundError(
				`Permission with ID ${notFoundPermissionIds.join(
					", "
				)} not found`
			);
		}

		// Check shop member limit
		const shopMemberCount = await ShopMember.countDocuments(
			{
				shopId: shop._id,
				status: "staff",
			}
		);

		if (shopMemberCount >= 3) {
			throw new ValidationError(
				"The shop already has three staff members"
			);
		}

		const shopMembers = [];
		const newPermissions = [];
		for (const permission of permissions) {
			const newPerm = new Types.ObjectId(permission);
			newPermissions.push(newPerm);
		}

		for (const inviteeId of inviteeIds) {
			if (inviteeId == userId)
				throw new ValidationError("User can't invite self");
			// Get the receiver user
			const receiverUser = await checkUserById(
				inviteeId,
				userService
			);
			console.log("Hello World", receiverUser);

			if (!receiverUser) {
				throw new NotFoundError(
					`User with ID ${inviteeId} not found`
				);
			}

			// Check user membership limit
			const userMembershipCount =
				await ShopMember.countDocuments({
					userId: inviteeId,
					status: "staff",
				});

			if (userMembershipCount >= 3) {
				throw new ValidationError(
					`User ${receiverUser.firstName} ${receiverUser.lastName} has exceeded the shop membership limit`
				);
			}

			// Check if the user is already a member of the shop
			let isMember = await ShopMember.findOne({
				userId: inviteeId,
				shopId: shop._id,
			});

			if (isMember) {
				if (
					["declined", "cancelled"].includes(
						isMember.status
					)
				) {
					isMember.status = "pending";
					isMember.permissions = newPermissions;
					await isMember.save();
					shop.shopMembers.push(isMember._id);
					await shop.save();
					shopMembers.push(isMember);
				} else if (["staff"].includes(isMember.status)) {
					throw new ValidationError(
						"This user is already a staff member of this shop"
					);
				} else if (["pending"].includes(isMember.status)) {
					throw new ValidationError(
						`Invite already sent; invite status is still pending. id: ${isMember.userId}`
					);
				}
			} else {
				const shopMember = new ShopMember({
					userId: inviteeId,
					shopId: shop._id,
					permissions,
					status: "pending",
				});
				await shopMember.save();
				shop.shopMembers.push(shopMember._id);
				await shop.save();
				shopMembers.push(shopMember);

				// Send notification to the invitee
				const invitedUser = await userNotificationInfo(
					inviteeId
				);
				await notificationService(
					"MotoPay",
					invitedUser,
					"You've Been Invited to Join a Shop!",
					`Congratulations! You've been invited to join ${shop.brand_name} as a member. Please check your app to accept and start exploring, or reject if you're not interested.`
				);
			}
		}

		return res.send(
			successResponse("Invites sent successfully", {
				shopMembers,
			})
		);
	} catch (error) {
		next(error);
	}
};

// add permission to a shop member - vendor
export const addPermission = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userService = req.userService;

		const { userId, user } = await getUserIdAndUser(req);

		const { shopMemberId, permissions, transactionPin } =
			req.body;

		// Extract token from headers
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			throw new Error("Authorization token is required");
		}

		const accountNo = user.accountNumber;

		const pinValidationResponse = await validatePin(
			accountNo.toString(),
			transactionPin.toString(),
			token
		);

		// Handle response from pin validation
		if (pinValidationResponse.code !== "00") {
			throw new Error("Incorrect pin");
		}

		// Get the sender shop
		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});
		if (!shop)
			throw new NotFoundError("an active shop not found");
		// Check if the permissions exist in the shop permission model
		const permissionsExist = await ShopPermission.find({
			_id: { $in: permissions },
		});
		const notFoundPermissionIds = permissions.filter(
			(permissionId) =>
				!permissionsExist.some((p) =>
					p._id.equals(permissionId)
				)
		);
		if (notFoundPermissionIds.length > 0) {
			notFoundPermissionIds.forEach(
				(notFoundPermissionId) => {
					throw new NotFoundError(
						`Permission with ID ${notFoundPermissionId} not found`
					);
				}
			);
		}

		// Check if the user is already a member of the shop
		const shopMember = await ShopMember.findOne({
			_id: shopMemberId,
			shopId: shop._id,
			status: "staff",
		});
		if (!shopMember) {
			throw new NotFoundError("Shop member not found");
		}
		// Check if the permission already exists in the array
		const existingPermissions = shopMember.permissions.map(
			(p) => p.toString()
		);
		const newPermissions = permissions.filter(
			(permissionId) =>
				!existingPermissions.includes(permissionId)
		);
		// Push new permissions to the shopMember array property
		shopMember.permissions.push(...newPermissions);
		await shopMember.save();
		// Send notification of permission update
		const invitedUser = userNotificationInfo(
			shopMember.userId
		);
		await notificationService(
			"MotoPay",
			invitedUser,
			"New Permission Granted!",
			`You have been granted a new permission for ${shop.brand_name}. Please check your app to see the details and make the most of your new access!`
		);
		return res.send(
			successResponse(
				"Permissions added successfully",
				shopMember
			)
		);
	} catch (error) {
		next(error);
	}
};

// remove permission to a shop member - vendor
export const removePermission = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userService = req.userService;
		const { userId, user } = await getUserIdAndUser(req);

		const { shopMemberId, permissions, transactionPin } =
			req.body;

		// Extract token from headers
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			throw new Error("Authorization token is required");
		}

		const accountNo = user.accountNumber;

		const pinValidationResponse = await validatePin(
			accountNo.toString(),
			transactionPin.toString(),
			token
		);

		// Handle response from pin validation
		if (pinValidationResponse.code !== "00") {
			throw new Error("Incorrect pin");
		}

		// Get the sender shop
		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});
		if (!shop)
			throw new NotFoundError("an active shop not found");
		// Check if the user is already a member of the shop
		const shopMember = await ShopMember.findOne({
			_id: shopMemberId,
			shopId: shop._id,
		});
		if (!shopMember) {
			throw new NotFoundError("Shop member not found");
		}
		// Remove permissions from the shopMember array property
		shopMember.permissions = shopMember.permissions.filter(
			(permission) =>
				!permissions.includes(permission.toString())
		);
		await shopMember.save();
		const invitedUser = await userNotificationInfo(
			shopMember.userId
		);
		// Notify user of the permission update
		await notificationService(
			"MotoPay",
			invitedUser,
			"Permission Removed",
			`Your permissions for ${shop.brand_name} have been updated. Please check your app for the latest details on your access privileges`
		);
		return res.send(
			successResponse(
				"Permissions removed successfully",
				shopMember
			)
		);
	} catch (error) {
		next(error);
	}
};

// remove shop member from shop - vendor
export const removeShopMember = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userService = req.userService;
		const { userId, user } = await getUserIdAndUser(req);

		const shopMemberId = req.params.id;

		const { transactionPin } = req.body;

		// Extract token from headers
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			throw new Error("Authorization token is required");
		}

		const accountNo = user.accountNumber;

		const pinValidationResponse = await validatePin(
			accountNo.toString(),
			transactionPin.toString(),
			token
		);

		// Handle response from pin validation
		if (pinValidationResponse.code !== "00") {
			throw new Error("Incorrect pin");
		}

		// Get the sender shop
		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});
		if (!shop)
			throw new NotFoundError("an active shop not found");

		// Check if the user is already a member of the shop
		const shopMember = await ShopMember.findOne({
			_id: shopMemberId,
			shopId: shop._id,
		});
		if (!shopMember) {
			throw new NotFoundError("Shop member not found");
		}
		// Push new permissions to the shopMember array property
		shopMember.status = "cancelled";
		shopMember.permissions = [];
		await shopMember.save();
		// Remove the shopMember ID from the shop's shopMembers array
		shop.shopMembers = shop.shopMembers.filter(
			(memberId) => memberId.toString() !== shopMemberId
		);
		await shop.save();
		// Notify user of the shop member update
		const invitedUser = await userNotificationInfo(
			shopMember.userId
		);
		await notificationService(
			"MotoPay",
			invitedUser,
			"Membership Removed",
			`You have been removed as a member of ${shop.brand_name}. Please check your app for more details.`
		);
		return res.send(
			successResponse(
				"User removed successfully",
				shopMember
			)
		);
	} catch (error) {
		next(error);
	}
};

// get all my shop members and their permission - vendor
export const viewShopMembers = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		// query params
		const { status } = req.query;
		// check if the user has an active shop
		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});
		if (!shop) {
			throw new NotFoundError("an active shop not found");
		}
		let shopMembers;
		if (
			status === "pending" ||
			status === "declined" ||
			status === "staff"
		) {
			shopMembers = await ShopMember.find({
				shopId: shop._id,
				status: status,
			}).populate({
				path: "permissions",
				select: "permissionCode permissionDescription",
			});
		} else {
			shopMembers = await ShopMember.find({
				shopId: shop._id,
				status: { $ne: "cancelled" },
			}).populate({
				path: "permissions",
				select: "-_id permissionCode permissionDescription",
			});
		}
		// Use your existing approach to get user details
		const responseData = shopMembers.map(
			async (shopMember) => {
				const theUser = await checkUserById(
					shopMember.userId,
					userService
				);
				return {
					user: {
						id: theUser.id,
						firstName: theUser.firstName,
						lastName: theUser.lastName,
					},
					shopMember: {
						_id: shopMember._id,
						shopId: shopMember.shopId,
						permissions: shopMember.permissions,
						status: shopMember.status,
						createdAt: shopMember.createdAt,
						updatedAt: shopMember.updatedAt,
					},
				};
			}
		);

		// Wait for all promises to resolve
		const resolvedData = await Promise.all(responseData);

		return res.send(
			successResponse(
				"Shop members retrieved successfully",
				resolvedData
			)
		);
	} catch (error) {
		next(error);
	}
};

// get a single shop member and it's permission - vendor
export const viewShopMember = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const shopMemberId = req.params.shopMemberId;
		// check if the user has an active shop
		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});
		if (!shop) {
			throw new NotFoundError("an active shop not found");
		}
		let shopMember = await ShopMember.findOne({
			_id: shopMemberId,
			shopId: shop._id,
		}).populate({
			path: "permissions",
			select: "-_id permissionCode permissionDescription",
		});
		const theUser = await checkUserById(
			shopMember.userId,
			userService
		);
		const { id, firstName, lastName } = theUser;
		const responseData = {
			user: {
				id,
				firstName,
				lastName,
			},
			shopMember: {
				_id: shopMember._id,
				shopId: shopMember.shopId,
				permissions: shopMember.permissions,
				status: shopMember.status,
				createdAt: shopMember.createdAt,
				updatedAt: shopMember.updatedAt,
			},
		};
		return res.send(
			successResponse(
				"Shop member retrieved successfully",
				responseData
			)
		);
	} catch (error) {
		next(error);
	}
};

// accept or reject shop invite - user
export const acceptOrRejectShopInvite = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		let { status, shopMemberId } = req.body;

		if (!status || !shopMemberId)
			throw new ValidationError("all fields are required");
		console.log(shopMemberId);
		// check if the invite exist
		const shopMember = await ShopMember.findOne({
			_id: shopMemberId,
			userId: userId,
			status: "pending",
		});

		if (!shopMember)
			throw new NotFoundError("Invite not found");

		// update the invite
		status = status.toLowerCase();
		if (status == "accept") {
			shopMember.status = "staff";
			await shopMember.save();
		} else if (status == "reject") {
			shopMember.status = "declined";
			await shopMember.save();
		} else {
			throw new ValidationError(
				"Invalid status, please select accept or reject"
			);
		}
		// Notify shop owner about user decision
		const shop = await Shop.findOne({
			_id: shopMember.shopId,
		});
		if (!shop) throw new NotFoundError("shop not found");
		const shopOwner = await userNotificationInfo(shop.user);
		const invitedUser = await userNotificationInfo(userId);
		await notificationService(
			"MotoPay",
			shopOwner,
			"Invitation Response",
			`Your invitation to ${invitedUser.firstName} ${invitedUser.lastName} has been ${status}. Please check your app for more details`
		);

		return res.send(
			successResponse("ShopMember updated", shopMember)
		);
	} catch (error) {
		next(error);
	}
};

// view all my shop memberships - user
export const viewMemberships = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);

		// query params
		const { status } = req.query;

		let filter: any = { userId: userId };

		// Only show "pending" or "staff" statuses
		if (status === "pending" || status === "staff") {
			filter.status = status;
		} else {
			// Return all except "declined"
			filter.status = { $ne: "declined" };
		}

		const shopMembers = await ShopMember.find(filter)
			.populate({
				path: "permissions",
				select: "-_id permissionCode permissionDescription",
			})
			.populate({
				path: "shopId",
				select:
					"logoImageUrl backgroundImageUrl brand_name description category",
				populate: {
					path: "category",
					select: "_id name",
				},
			});

		return res.send(
			successResponse("Shop members", shopMembers)
		);
	} catch (error) {
		next(error);
	}
};

// view all my shop membership - user
export const viewMembership = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		const user = await checkUserById(userId, userService);
		const shopMemberId = req.params.shopMemberId;

		let shopMember = await ShopMember.findOne({
			_id: shopMemberId,
			userId: userId,
		}).populate({
			path: "permissions",
			select: "permissionCode permissionDescription",
		});
		const shop = await Shop.findById({
			_id: shopMember.shopId,
			userId: userId,
		});
		const {
			_id,
			category,
			logoImageUrl,
			brand_name,
			description,
			backgroundImageUrl,
		} = shop;
		const getCategory = await Category.findOne({
			_id: category,
		});
		const { name } = getCategory;
		const { id, firstName, lastName } = user;
		const responseData = {
			user: {
				id,
				firstName,
				lastName,
			},
			shop: {
				_id,
				category,
				categoryName: name,
				logoImageUrl,
				brand_name,
				description,
				backgroundImageUrl,
			},
			shopMember: {
				_id: shopMember._id,
				shopId: shopMember.shopId,
				permissions: shopMember.permissions,
				status: shopMember.status,
				createdAt: shopMember.createdAt,
				updatedAt: shopMember.updatedAt,
			},
		};
		return res.send(
			successResponse("Shop members", responseData)
		);
	} catch (error) {
		next(error);
	}
};

// exit from shop as member - user
export const exitShop = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const shopMemberId = req.params.id;
		// Check if the user is already a member of the shop
		const shopMember = await ShopMember.findOne({
			_id: shopMemberId,
			userId: userId,
			status: "staff",
		});

		if (!shopMember) {
			throw new NotFoundError("Shop member not found");
		}
		// Push new permissions to the shopMember array property
		shopMember.status = "declined";
		shopMember.permissions = [];
		await shopMember.save();

		// Notify shop owner about user decision
		const shop = await Shop.findOne({
			_id: shopMember.shopId,
		});
		if (!shop) throw new NotFoundError("shop not found");
		const shopOwner = await userNotificationInfo(shop.user);
		const invitedUser = await userNotificationInfo(userId);
		await notificationService(
			"MotoPay",
			shopOwner,
			"User Departure",
			`${invitedUser.firstName} ${invitedUser.lastName} has left ${shop.brand_name}. Please check your app for further information.`
		);
		return res.send(
			successResponse(
				"user exited shop successfully",
				shopMember
			)
		);
	} catch (error) {
		next(error);
	}
};

export const adjustPrices = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		const { percentage, type } =
			req.body as AdjustPriceInput["body"];
		const multiplier = 1 + Number(percentage) / 100;

		const shop = await Shop.findOne({
			user: userId,
			status: StatusTypes.ACTIVE,
		});

		if (!shop) throw new NotFoundError("Shop not found");

		//check if user has any products in shop

		const products = await Product.find({
			shop: shop._id,
			status: {
				$in: [
					ProductStatus.VERIFIED,
					ProductStatus.OUT_OF_STOCK,
				],
			},
		});

		if (products.length < 1) {
			throw new NotFoundError("Shop has no products");
		}

		if (type === "all") {
			await Product.updateMany(
				{ shop: shop._id },
				{
					$mul: {
						productPrice: new mongoose.Types.Decimal128(
							String(multiplier)
						),
					},
					new: true,
				}
			);
		}

		if (type === "discount") {
			await Product.updateMany(
				{
					shop: shop._id,
					//where discountAmount is greater than 0
					discountAmount: {
						$gt: 0,
					},
				},
				{
					$mul: {
						productPrice: new mongoose.Types.Decimal128(
							String(multiplier)
						),
					},
					new: true,
				}
			);
		}

		if (type === "non_discount") {
			await Product.updateMany(
				{ shop: shop._id, discountAmount: 0 },
				{
					$mul: {
						productPrice: new mongoose.Types.Decimal128(
							String(multiplier)
						),
					},
					new: true,
				}
			);
		}

		console.log(multiplier);

		let incremented =
			percentage < 0 ? "decremented" : "incremented";

		return res.send(
			successResponse(
				`Prices ${incremented} successfully`,
				null
			)
		);
	} catch (error) {
		next(error);
	}
};

// update shop name
export const updateShopName = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const userId = req.user && req.user.id;
		const userService = req.userService;

		await checkUserById(userId, userService);

		// Get new shop name from the request body
		const { newShopName } =
			req.body as UpdateShopNameInput["body"];

		// Find and update the shop by user id
		const shop = await Shop.findOneAndUpdate(
			{ user: userId },
			{ brand_name: newShopName },
			{ new: true }
		);

		if (!shop) {
			throw new NotFoundError("Shop not found");
		}
		await shop.save();
		return res.send(
			successResponse(
				"Shop name updated successfully",
				shop
			)
		);
	} catch (error) {
		next(error);
	}
};

// update shop description
export const updateShopDesc = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const userId = req.user && req.user.id;
		const userService = req.userService;

		await checkUserById(userId, userService);

		// Get new shop name from the request body
		const { newDescription } =
			req.body as UpdateShopDescInput["body"];

		// Find and update the shop by user id
		const shop = await Shop.findOneAndUpdate(
			{ user: userId },
			{ description: newDescription },
			{ new: true }
		);

		if (!shop) {
			throw new NotFoundError("Shop not found");
		}
		await shop.save();
		return res.send(
			successResponse(
				"Shop Description updated successfully",
				shop
			)
		);
	} catch (error) {
		next(error);
	}
};

export const updateShopContactInfo = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const userId = req.user && req.user.id;
		const userService = req.userService;

		await checkUserById(userId, userService);

		// Get new shop name from the request body
		const { phone, email, address } =
			req.body as UpdateShopContactInfoInput["body"];

		// Find and update the shop by user id
		const shop = await Shop.findOneAndUpdate(
			{ user: userId },
			{
				official_phone_number: phone,
				official_email: email,
				address: address,
			},
			{ new: true }
		);

		if (!shop) {
			throw new NotFoundError("Shop not found");
		}
		await shop.save();
		return res.send(
			successResponse(
				"Shop contact info updated successfully",
				shop
			)
		);
	} catch (error) {
		next(error);
	}
};

export const enableEmailNotification = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const userId = req.user && req.user.id;
		const userService = req.userService;

		await checkUserById(userId, userService);

		// Find and update the shop by user id
		const shop = await Shop.findOne({ user: userId });

		if (!shop) {
			throw new NotFoundError("Shop not found");
		}

		// Correct the logic to update enableEmailNotification
		shop.enableEmailNotification =
			!shop.enableEmailNotification;

		const status = shop.enableEmailNotification
			? "enabled"
			: "disabled";

		await shop.save();
		return res.send(
			successResponse(
				`Email notification ${status} successfully`,
				shop
			)
		);
	} catch (error) {
		next(error);
	}
};

export const enablePushNotification = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const userId = req.user && req.user.id;
		const userService = req.userService;

		await checkUserById(userId, userService);

		// Find and update the shop by user id
		const shop = await Shop.findOne({ user: userId });

		if (!shop) {
			throw new NotFoundError("Shop not found");
		}

		// Correct the logic to update enableEmailNotification
		shop.pushNotifications = !shop.pushNotifications;

		const status = shop.pushNotifications
			? "enabled"
			: "disabled";

		await shop.save();
		return res.send(
			successResponse(
				`Push notification ${status} successfully`,
				shop
			)
		);
	} catch (error) {
		next(error);
	}
};

export const uploadBackGroundImage = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// if (!req.file) {
		// 	throw new NotFoundError("No file uploaded");
		// }

		const { userId } = await getUserIdAndUser(req);

		const { backgroundImageUrl, shopId } =
			req.body as shopBgInput["body"];

		// const response = await uploadBlobService(req.file);
		// console.log(response);

		// verify upload product permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"update_shop_image"
		);

		const shop = await Shop.findById(shopId);
		if (!shop) throw new NotFoundError("invalid shop");

		const updatedShop = await Shop.findOneAndUpdate(
			{ _id: shopId },
			{
				backgroundImageUrl: backgroundImageUrl,
			}
		);

		saveShopAction(
			userId,
			"updated your shop image",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"Background image uploaded successfully",
				updatedShop.backgroundImageUrl
			)
		);
	} catch (error) {
		next(error);
	}
};

export const updateShopLogo = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// if (!req.file) {
		// 	throw new NotFoundError("No file uploaded");
		// }

		const { userId } = await getUserIdAndUser(req);

		const { logoImageUrl, shopId } =
			req.body as shopDPInput["body"];

		// const response = await uploadBlobService(req.file);
		// console.log(response);

		// verify upload product permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"update_shop_image"
		);

		const shop = await Shop.findById(shopId);
		if (!shop) throw new NotFoundError("invalid shop");

		const updatedShop = await Shop.findOneAndUpdate(
			{ _id: shopId },
			{
				logoImageUrl: logoImageUrl,
			}
		);

		saveShopAction(
			userId,
			"updated your shop image",
			shopId.toString()
		);
		return res.send(
			successResponse(
				"Shop logo URL updated successfully",
				updatedShop.logoImageUrl
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSelfHelp = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const selfHelps = await ShopSelfHelp.find();
		return res.send(
			successResponse(
				"self retrieved successfully",
				selfHelps
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getColours = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const colours = await Colour.find().select(
			"-__v -createdAt -updatedAt"
		);
		return res.send(
			successResponse(
				"colour fetched successfully",
				colours
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getColour = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const id = req.params.id;
		const colour = await Colour.findById(id).select(
			"-__v -createdAt -updatedAt"
		);
		if (!colour)
			throw new NotFoundError("colour not found");
		return res.send(
			successResponse("colour fetched successfully", colour)
		);
	} catch (error) {
		next(error);
	}
};

const calculateScore = (points: number, weight: number) =>
	points * weight;

export const getSellerScoreSystem = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		await getUserIdAndUser(req);

		// Extract shop id from params
		const shopId = req.params.id;

		// Initialize scores
		let averageRatingScore = 0;
		let positiveReviewScore = 0;
		let orderCompletionScore = 0;
		let acceptedOrderScore = 0;
		let disputeReturnScore = 0;
		let contentNameScore = 0;
		let contentDescriptionScore = 0;
		let contentAboutItemScore = 0;

		// Metrics weights
		const metrics = {
			averageRating: 0.15,
			positiveReviews: 0.15,
			orderCompletion: 0.25,
			acceptedOrders: 0.05,
			disputeReturn: 0.2,
			contentName: 0.05,
			contentDescription: 0.05,
			contentAboutItem: 0.1,
		};

		// Get shop and validate existence
		const shop = await Shop.findOne({
			_id: shopId,
			status: StatusTypes.ACTIVE,
		}).lean();
		if (!shop) throw new NotFoundError("shop not found");

		// Extract shop products
		const products = await Product.find({
			shop: shopId,
		}).lean();

		// Validate if shop has products
		if (products.length == 0)
			throw new ValidationError(
				"No products found for this shop"
			);

		// Customer reviews
		for (const product of products) {
			// Getting product reviews
			const reviews = await Review.find({
				product: product._id,
			}).lean();

			// Customer reviews
			if (reviews.length > 0) {
				// Getting rating score
				const averageRating =
					reviews.reduce(
						(acc, review) => acc + review.rating,
						0
					) / reviews.length;

				averageRatingScore += calculateScore(
					averageRating > 4
						? 100
						: averageRating >= 3
						? 70
						: 30,
					metrics.averageRating
				);
				// Getting positive review score
				const positiveReviews = reviews.filter(
					(review) => review.rating >= 4
				).length;
				positiveReviewScore += calculateScore(
					positiveReviews / reviews.length > 0.55
						? 100
						: positiveReviews / reviews.length >= 0.3
						? 70
						: 30,
					metrics.positiveReviews
				);
			} else {
				averageRatingScore += calculateScore(
					30,
					metrics.averageRating
				);
				positiveReviewScore += calculateScore(
					30,
					metrics.positiveReviews
				);
			}
			contentNameScore += calculateScore(
				product.productName?.split(" ").length > 15
					? 100
					: 50,
				metrics.contentName
			);
			contentDescriptionScore += calculateScore(
				product.productDescription?.split(" ").length >= 150
					? 100
					: 50,
				metrics.contentDescription
			);
			if (product.keyFeature) {
				contentAboutItemScore += calculateScore(
					product.keyFeature.split(" ").length > 100
						? 100
						: 50,
					metrics.contentAboutItem
				);
			}
		}

		// Order Fulfillment
		const fiveDaysAgo = new Date(
			Date.now() - 5 * 24 * 60 * 60 * 1000
		);
		// Get order length
		const shopOrders = await Order.find({ shop: shopId });
		const orderLength = shopOrders.length;

		const orders = await Order.find({
			shop: shopId,
			status: OrderStatus.DELIVERED,
			paymentStatus: OrderPaymentStatus.PAID,
			deliveryStatus: OrderDeliveryStatus.DELIVERED,
			deliveryDate: { $gte: fiveDaysAgo },
		}).lean();
		if (orders.length > 0) {
			const completedOrders = orders.length;

			orderCompletionScore += calculateScore(
				completedOrders / orderLength > 0.9
					? 100
					: completedOrders / orderLength >= 0.8
					? 70
					: 30,
				metrics.orderCompletion
			);
		}

		const acceptedOrders = await Order.find({
			shop: shopId,
			status: {
				$in: [OrderStatus.ACCEPTED, OrderStatus.DELIVERED],
			},
		}).lean();

		acceptedOrderScore += calculateScore(
			acceptedOrders.length / orderLength > 0.9 ? 100 : 30,
			metrics.acceptedOrders
		);

		// Calculate Dispute Score
		const shopDisputes = await DisputeModel.find({
			shopID: shopId,
		}).lean();
		const disputeLength = shopDisputes.length;
		disputeReturnScore += calculateScore(
			disputeLength / orderLength > 0.9
				? 100
				: disputeLength / orderLength >= 0.8
				? 70
				: 30,
			metrics.disputeReturn
		);

		// Normalize scores
		const productCount = products.length;
		averageRatingScore /= productCount;
		positiveReviewScore /= productCount;
		contentNameScore /= productCount;
		contentDescriptionScore /= productCount;
		contentAboutItemScore /= productCount;

		// Calculate final seller score using weights
		const totalWeightedScore =
			averageRatingScore +
			positiveReviewScore +
			orderCompletionScore +
			acceptedOrderScore +
			disputeReturnScore +
			contentNameScore +
			contentDescriptionScore +
			contentAboutItemScore;

		const totalWeight =
			metrics.averageRating +
			metrics.positiveReviews +
			metrics.orderCompletion +
			metrics.acceptedOrders +
			metrics.disputeReturn +
			metrics.contentName +
			metrics.contentDescription +
			metrics.contentAboutItem;

		let sellerScore = Math.round(
			totalWeightedScore / totalWeight
		);

		return res.send(
			successResponse(
				"Shop metrics score fetched successfully",
				sellerScore
			)
		);
	} catch (error) {
		next(error);
	}
};

export const viewMyShopActivities = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Validate token
		const { userId } = await getUserIdAndUser(req);
		// Validate shop owner
		const shop = await Shop.findOne({
			user: userId,
		});
		if (!shop) throw new NotFoundError("invalid operation");

		// Extract shop actions
		const shopActions = await ShopAction.find({
			shop: shop._id,
		}).select("user action createdAt");

		// Process each shop action and retrieve user information
		const responses = await Promise.all(
			shopActions.map(async (shopAction) => {
				const user = await userNotificationInfo(
					shopAction.user
				);
				return {
					user: `${user.firstName} ${user.lastName}`,
					action: shopAction.action,
					date: shopAction.createdAt,
				};
			})
		);

		return res.send(
			successResponse(
				"shop activities fetched successfully",
				responses
			)
		);
	} catch (error) {
		next(error);
	}
};

export const productSegmentations = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.id;

		// Validate shop
		const shop = await Shop.findOne({
			_id: shopId,
		});
		if (!shop) throw new NotFoundError("invalid shop");

		// verify upload product permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"analysis"
		);

		let mostSoldProducts = [];
		let leastSoldProducts = [];
		let mostReviewedProductDetails = [];
		let highQualityProductDetails = [];
		let mostWishedProductDetails = [];
		let trendingProducts = [];

		// Extract shop products
		const products = await Product.find({
			shop: shop._id,
		}).select(
			"productImages productName productPrice stockQuantity quantitySold views reviews"
		);
		// Most Sold products
		mostSoldProducts = products
			.sort((a, b) => b.quantitySold - a.quantitySold)
			.slice(
				0,
				Math.max(3, Math.ceil(products.length * 0.1))
			);

		// Least Sold Products
		leastSoldProducts = products
			.filter((product) => product.quantitySold <= 1)
			.sort((a, b) => b.stockQuantity - a.stockQuantity)
			.slice(0, 5);

		// Extract the product IDs from the products you already retrieved
		const productIds = products.map(
			(product) => product._id
		);

		// Aggregate reviews for products, grouped by product ID
		const mostReviewedProductsWithHighRating =
			await Review.aggregate([
				{
					$match: {
						product: { $in: productIds },
					},
				},
				{
					$group: {
						_id: "$product",
						count: { $sum: 1 },
					},
				},
				{ $sort: { count: -1 } },
				{ $limit: 3 },
			]);

		// Get the details of the most reviewed products from the original products list
		mostReviewedProductDetails = products.filter(
			(product) =>
				mostReviewedProductsWithHighRating.some(
					(reviewedProduct) =>
						reviewedProduct._id.equals(product._id)
				)
		);

		// Step 1: Get products with return records
		const productsWithReturnRecords =
			await ReturnProductModel.aggregate([
				{ $match: { productId: { $in: productIds } } },
				{ $group: { _id: "$productId" } },
			]);

		// Extract the product IDs that have return records
		const productIdsWithReturns =
			productsWithReturnRecords.map((record) => record._id);

		// Step 2: Filter out products with return records
		const productsWithoutReturns = products.filter(
			(product) =>
				!productIdsWithReturns.includes(product._id)
		);

		// Extract IDs of products that do not have return records
		const productIdsWithoutReturns =
			productsWithoutReturns.map((product) => product._id);

		// Step 3: Find high-quality products (rating of 4 or more) among products without return records
		const highQualityProducts = await Review.aggregate([
			{
				$match: {
					product: { $in: productIdsWithoutReturns },
					rating: { $gte: 4 },
				},
			},
			{
				$group: {
					_id: "$product",
					avgRating: { $avg: "$rating" },
				},
			},
			{
				$match: { _id: { $in: productIdsWithoutReturns } },
			},
		]);

		// Step 4: Get the product details from the `products` array for high-quality products
		highQualityProductDetails = products.filter((product) =>
			highQualityProducts.some((highQualityProduct) =>
				highQualityProduct._id.equals(product._id)
			)
		);

		// Aggregate wishlist data to get the count of each product being wished
		const customerWishProducts = await WishList.aggregate([
			{ $unwind: "$items" },
			{ $match: { items: { $in: productIds } } },
			{ $group: { _id: "$items", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
			{ $limit: 5 },
		]);

		// Fetch the details of the most wished products from the products array
		mostWishedProductDetails = products.filter((product) =>
			customerWishProducts.some((wishProduct) =>
				wishProduct._id.equals(product._id)
			)
		);

		trendingProducts = products
			.filter((product) => {
				const last30DaysViews = product.views.slice(-30);
				const totalViewsLast30Days = last30DaysViews.reduce(
					(acc, views) => acc + views,
					0
				);
				return (
					totalViewsLast30Days >
					(product.views.length - 30
						? product.views
								.slice(-60, -30)
								.reduce((acc, views) => acc + views, 0)
						: 0)
				);
			})
			.sort(
				(a, b) =>
					b.views
						.slice(-30)
						.reduce((acc, v) => acc + v, 0) -
					a.views.slice(-30).reduce((acc, v) => acc + v, 0)
			)
			.slice(0, 5);

		saveShopAction(
			userId,
			"viewed shop analysis",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"product analysis fetched successfully",
				{
					mostSoldProducts,
					leastSoldProducts,
					mostReviewedProductDetails,
					highQualityProductDetails,
					mostWishedProductDetails,
					trendingProducts,
				}
			)
		);
	} catch (error) {
		next(error);
	}
};

export const mostSoldProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.id;

		// Get date range from query parameters
		const { startDate, endDate } = req.query;

		// Validate shop
		const shop = await Shop.findOne({
			_id: shopId,
		});
		if (!shop) throw new NotFoundError("Invalid shop");

		// Verify upload product permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"analysis"
		);

		// Convert query parameters to Date objects
		const start = startDate
			? new Date(startDate as string)
			: null;
		const end = endDate
			? new Date(endDate as string)
			: null;

		// Construct date filter
		const dateFilter: any = {};
		if (start && !isNaN(start.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$gte: start,
			};
		}
		if (end && !isNaN(end.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$lte: end,
			};
		}

		// Extract shop products with date filter if applicable
		const products = await Product.find({
			shop: shop._id,
			...dateFilter,
		}).select(
			"productImages productName productPrice stockQuantity quantitySold views reviews createdAt"
		);

		// Most Sold products
		const mostSoldProducts = products.sort(
			(a, b) => b.quantitySold - a.quantitySold
		);

		saveShopAction(
			userId,
			"viewed shop analysis",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"Most sold products fetched successfully",
				mostSoldProducts
			)
		);
	} catch (error) {
		next(error);
	}
};

export const leastSoldProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.id;

		// Get date range from query parameters
		const { startDate, endDate } = req.query;

		// Validate shop
		const shop = await Shop.findOne({
			_id: shopId,
		});
		if (!shop) throw new NotFoundError("Invalid shop");

		// Verify upload product permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"analysis"
		);

		// Convert query parameters to Date objects
		const start = startDate
			? new Date(startDate as string)
			: null;
		const end = endDate
			? new Date(endDate as string)
			: null;

		// Construct date filter
		const dateFilter: any = {};
		if (start && !isNaN(start.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$gte: start,
			};
		}
		if (end && !isNaN(end.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$lte: end,
			};
		}

		// Extract shop products with date filter if applicable
		const products = await Product.find({
			shop: shop._id,
			...dateFilter,
		}).select(
			"productImages productName productPrice stockQuantity quantitySold views reviews createdAt"
		);

		// Least Sold products
		const leastSoldProducts = products
			.filter((product) => product.quantitySold <= 1)
			.sort((a, b) => b.stockQuantity - a.stockQuantity);

		saveShopAction(
			userId,
			"viewed shop analysis",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"Least sold products fetched successfully",
				leastSoldProducts
			)
		);
	} catch (error) {
		next(error);
	}
};

export const mostReviewedProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.id;

		// Get date range from query parameters
		const { startDate, endDate } = req.query;

		// Validate shop
		const shop = await Shop.findOne({
			_id: shopId,
		});
		if (!shop) throw new NotFoundError("Invalid shop");

		// Verify upload product permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"analysis"
		);

		// Convert query parameters to Date objects
		const start = startDate
			? new Date(startDate as string)
			: null;
		const end = endDate
			? new Date(endDate as string)
			: null;

		// Construct date filter
		const dateFilter: any = {};
		if (start && !isNaN(start.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$gte: start,
			};
		}
		if (end && !isNaN(end.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$lte: end,
			};
		}

		// Extract shop products with date filter if applicable
		const products = await Product.find({
			shop: shop._id,
			...dateFilter,
		}).select(
			"productImages productName productPrice stockQuantity quantitySold views reviews createdAt"
		);

		// Extract the product IDs from the products you already retrieved
		const productIds = products.map(
			(product) => product._id
		);

		// Aggregate reviews for products, grouped by product ID
		const reviewAggregations = await Review.aggregate([
			{
				$match: {
					product: { $in: productIds },
				},
			},
			{
				$group: {
					_id: "$product",
					totalComments: { $sum: 1 },
					totalRatings: { $sum: 1 },
					averageRating: { $avg: "$rating" },
				},
			},
			{ $sort: { totalComments: -1 } },
			{ $limit: 3 },
		]);

		// Map the review aggregation results to include product details
		const mostReviewedProductsWithDetails = products.map(
			(product) => {
				const reviewData = reviewAggregations.find(
					(review) => review._id.equals(product._id)
				);
				return {
					...product.toObject(),
					totalComments: reviewData?.totalComments || 0,
					totalRatings: reviewData?.totalRatings || 0,
					averageRating: reviewData?.averageRating || 0,
				};
			}
		);

		saveShopAction(
			userId,
			"viewed shop analysis",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"Most reviewed products fetched successfully",
				mostReviewedProductsWithDetails
			)
		);
	} catch (error) {
		next(error);
	}
};

export const highQualityProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.id;

		// Get date range from query parameters
		const { startDate, endDate } = req.query;

		// Validate shop
		const shop = await Shop.findOne({ _id: shopId });
		if (!shop) throw new NotFoundError("Invalid shop");

		// Verify upload product permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"analysis"
		);

		// Convert query parameters to Date objects
		const start = startDate
			? new Date(startDate as string)
			: null;
		const end = endDate
			? new Date(endDate as string)
			: null;

		// Construct date filter
		const dateFilter: any = {};
		if (start && !isNaN(start.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$gte: start,
			};
		}
		if (end && !isNaN(end.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$lte: end,
			};
		}

		// Fetch all products with date filter if applicable
		const products = await Product.find({
			shop: shop._id,
			...dateFilter,
		}).select(
			"productImages productName productPrice stockQuantity quantitySold views reviews createdAt"
		);

		// Extract product IDs from products
		const productIds = products.map(
			(product) => product._id
		);

		// Get return records
		const productsWithReturnRecords =
			await ReturnProductModel.aggregate([
				{ $match: { productId: { $in: productIds } } },
				{
					$group: { _id: "$productId", count: { $sum: 1 } },
				},
			]);

		// Extract product IDs that have return records
		const productIdsWithReturns =
			productsWithReturnRecords.map((record) => record._id);

		// Add total returns and quantity sold to each product
		const productsWithReturnsAndSales = products.map(
			(product) => {
				const totalReturns =
					productsWithReturnRecords.find((record) =>
						record._id.equals(product._id)
					)?.count || 0;
				return {
					...product.toObject(),
					totalReturns,
					quantitySold: product.quantitySold || 0,
				};
			}
		);

		// Sort products: products with returns come first, then products without returns
		const sortedProducts = productsWithReturnsAndSales.sort(
			(a, b) => b.totalReturns - a.totalReturns
		);

		saveShopAction(
			userId,
			"viewed shop analysis",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"Products fetched and sorted successfully",
				sortedProducts
			)
		);
	} catch (error) {
		next(error);
	}
};

export const customerWishProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.id;

		// Validate shop
		const shop = await Shop.findOne({ _id: shopId });
		if (!shop) throw new NotFoundError("Invalid shop");

		// Verify upload product permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"analysis"
		);

		// Get date range from query parameters
		const { startDate, endDate } = req.query;

		// Convert query parameters to Date objects
		const start = startDate
			? new Date(startDate as string)
			: null;
		const end = endDate
			? new Date(endDate as string)
			: null;

		// Construct date filter
		const dateFilter: any = {};
		if (start && !isNaN(start.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$gte: start,
			};
		}
		if (end && !isNaN(end.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$lte: end,
			};
		}

		// Extract shop products
		const products = await Product.find({
			shop: shop._id,
		}).select(
			"productImages productName productPrice stockQuantity quantitySold views reviews"
		);

		// Extract product IDs from the products you already retrieved
		const productIds = products.map(
			(product) => product._id
		);

		// Aggregate wishlist data to get the count of each product being wished
		const customerWishProducts = await WishList.aggregate([
			{ $unwind: "$items" },
			{
				$match: {
					items: { $in: productIds },
					...dateFilter,
				},
			},
			{
				$group: { _id: "$items", totalWished: { $sum: 1 } },
			},
			{ $sort: { totalWished: -1 } },
		]);

		// Fetch the details of the most wished products from the products array
		const mostWishedProductDetails = products
			.filter((product) =>
				customerWishProducts.some((wishProduct) =>
					wishProduct._id.equals(product._id)
				)
			)
			.map((product) => {
				const wishData = customerWishProducts.find(
					(wishProduct) =>
						wishProduct._id.equals(product._id)
				);
				return {
					...product.toObject(),
					totalWished: wishData ? wishData.totalWished : 0,
				};
			});

		saveShopAction(
			userId,
			"viewed shop analysis",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"Customer wish products fetched successfully",
				mostWishedProductDetails
			)
		);
	} catch (error) {
		next(error);
	}
};

export const trendingProducts = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Authenticate user
		const { userId } = await getUserIdAndUser(req);
		const shopId = req.params.id;

		// Get date range from query parameters
		const { startDate, endDate } = req.query;

		// Validate shop
		const shop = await Shop.findOne({
			_id: shopId,
		});
		if (!shop) throw new NotFoundError("Invalid shop");

		// Verify upload product permission
		await checkShopPermission(
			userId,
			shopId.toString(),
			"analysis"
		);

		// Convert query parameters to Date objects
		const start = startDate
			? new Date(startDate as string)
			: null;
		const end = endDate
			? new Date(endDate as string)
			: null;

		// Construct date filter
		const dateFilter: any = {};
		if (start && !isNaN(start.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$gte: start,
			};
		}
		if (end && !isNaN(end.getTime())) {
			dateFilter["createdAt"] = {
				...dateFilter["createdAt"],
				$lte: end,
			};
		}

		// Extract shop products with date filter if applicable
		const products = await Product.find({
			shop: shop._id,
			...dateFilter,
		}).select(
			"productImages productName productPrice stockQuantity quantitySold views reviews"
		);

		// Aggregate wishlist data to get the count of each product being wished
		const customerWishProducts = await WishList.aggregate([
			{ $unwind: "$items" },
			{
				$match: {
					items: { $in: products.map((p) => p._id) },
				},
			},
			{ $group: { _id: "$items", count: { $sum: 1 } } },
		]);

		// Aggregate reviews to get the total number of reviews and average rating
		const reviewsAggregation = await Review.aggregate([
			{
				$match: {
					product: { $in: products.map((p) => p._id) },
				},
			},
			{
				$group: {
					_id: "$product",
					totalReviews: { $sum: 1 },
					avgRating: { $avg: "$rating" },
				},
			},
		]);

		// Combine data for trending products
		const trendingProducts = products.map((product) => {
			const wishCount =
				customerWishProducts.find((wp) =>
					wp._id.equals(product._id)
				)?.count || 0;
			const reviewData = reviewsAggregation.find((r) =>
				r._id.equals(product._id)
			);

			return {
				...product.toObject(),
				totalWishes: wishCount,
				totalComments: reviewData?.totalReviews || 0,
				averageRating: reviewData?.avgRating || 0,
			};
		});

		// Sort the products based on quantitySold, totalWishes, totalComments, and averageRating
		trendingProducts.sort(
			(a, b) =>
				b.quantitySold - a.quantitySold ||
				b.totalWishes - a.totalWishes ||
				b.totalComments - a.totalComments ||
				b.averageRating - a.averageRating
		);

		saveShopAction(
			userId,
			"viewed shop analysis",
			shopId.toString()
		);

		return res.send(
			successResponse(
				"Trending products fetched successfully",
				trendingProducts
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopActivityLogs = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const shop = await Shop.findOne({ user: userId });
		if (!shop) throw new NotFoundError("shop not found");

		// Pagination parameters
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const skip = (page - 1) * limit;

		// Date range parameters
		const startDate = req.query.startDate
			? new Date(req.query.startDate as string)
			: null;
		const endDate = req.query.endDate
			? new Date(req.query.endDate as string)
			: null;

		// Adjust end date to include the entire day
		if (endDate) {
			endDate.setHours(23, 59, 59, 999);
		}

		// Build query object
		const query: any = { shop: shop._id };

		if (startDate && endDate) {
			query.createdAt = { $gte: startDate, $lte: endDate };
		} else if (startDate) {
			query.createdAt = { $gte: startDate };
		} else if (endDate) {
			query.createdAt = { $lte: endDate };
		}

		// Get total count of shop activities
		const totalCount = await ShopAction.countDocuments(
			query
		);

		// Get shop activities with pagination and date range filter
		const shopLogs = await ShopAction.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const updatedShopLogs = await Promise.all(
			shopLogs.map(async (log) => {
				try {
					const { firstName, lastName } =
						await userNotificationInfo(log.user);
					return {
						_id: log._id,
						user: `${firstName} ${lastName}`,
						action: log.action,
						shop: log.shop,
						date: log.createdAt,
					};
				} catch (error) {
					console.error(
						`Error fetching user info for log ${log._id}:`,
						error
					);
					return {
						_id: log._id,
						user: "Unknown User",
						action: log.action,
						shop: log.shop,
						date: log.createdAt,
					};
				}
			})
		);

		// // Pagination metadata
		// const totalPages = Math.ceil(totalCount / limit);
		// const hasNextPage = page < totalPages;
		// const hasPrevPage = page > 1;
		// return res.send(
		// 	successResponse(
		// 		"Your shop logs fetched successfully",
		// 		{
		// 			logs: updatedShopLogs,
		// 			pagination: {
		// 				currentPage: page,
		// 				totalPages,
		// 				totalItems: totalCount,
		// 				itemsPerPage: limit,
		// 				hasNextPage,
		// 				hasPrevPage,
		// 			},
		// 		}
		// 	)
		// );

		return res.send(
			successResponse(
				"Your shop logs fetched successfully",
				updatedShopLogs
			)
		);
	} catch (error) {
		next(error);
	}
};

export const amountSuggestionRange = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId, user } = await getUserIdAndUser(req);
		// Extract the token from the request headers
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) {
			throw new Error("Authentication token is missing");
		}
		const { beneficiaryAccount } =
			req.body as amountSuggestInput["body"];
		// Default amounts to suggest if no transactions exist
		const defaultAmounts = [
			1000, 2000, 3000, 5000, 7000, 10000, 20000,
		];

		// Fetch all transactions at once
		const transactions = await getUserTransactions(
			user.accountNumber,
			token,
			1, // Fetch first page
			10000 // Increase page size to fetch more records at once
		);

		// Filter transactions with walletStatus "DEBIT" and matching beneficiaryAccount
		const allTransactions =
			transactions.data?.filter(
				(transaction) =>
					transaction.walletStatus === "DEBIT" &&
					transaction.beneficiaryAccount ===
						beneficiaryAccount
			) || [];

		// Check if there are no transaction records
		if (allTransactions.length === 0) {
			return res.send(
				successResponse(
					"Amount suggestions have been successfully determined!",
					defaultAmounts
				)
			);
		}

		// Extract all unique transaction amounts and sort them
		let suggestionAmount = Array.from(
			new Set(
				allTransactions.map(
					(transaction) => transaction.amount
				)
			)
		).sort((a, b) => Number(a) - Number(b)); // Sort from smallest to largest

		// Generate suggestions based on the number of unique amounts
		if (suggestionAmount.length === 1) {
			const increment = Number(suggestionAmount[0]); // Increment by the same amount
			while (suggestionAmount.length < 6) {
				const newAmount =
					Number(
						suggestionAmount[suggestionAmount.length - 1]
					) + increment;
				suggestionAmount.push(newAmount);
			}
		} else if (suggestionAmount.length < 6) {
			const mostOccurredAmount =
				suggestionAmount[suggestionAmount.length - 1]; // Last amount is the most occurred
			const lastAmount = Number(
				suggestionAmount[suggestionAmount.length - 2]
			); // Second last amount
			const difference =
				Number(mostOccurredAmount) - lastAmount;

			while (suggestionAmount.length < 6) {
				const newAmount =
					Number(
						suggestionAmount[suggestionAmount.length - 1]
					) + difference;
				if (!suggestionAmount.includes(newAmount)) {
					suggestionAmount.push(newAmount);
				}
			}
		}

		// Ensure uniqueness and sort the final suggestion amounts
		suggestionAmount = Array.from(new Set(suggestionAmount))
			.sort((a, b) => Number(a) - Number(b))
			.slice(0, 7);

		return res.send(
			successResponse(
				"Amount suggestions have been successfully determined!",
				suggestionAmount
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopTransactions = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Validate shop owner
		const { userId, user } = await getUserIdAndUser(req);
		const shop = await Shop.findOne({ user: userId });
		if (!shop) throw new NotFoundError("shop not found");

		const acctNum = Number(user.accountNumber);

		// Date range parameters
		const startDate = req.query.startDate
			? new Date(req.query.startDate as string)
			: null;
		const endDate = req.query.endDate
			? new Date(req.query.endDate as string)
			: null;

		// Convert dates to milliseconds for comparison
		const startMillis = startDate
			? startDate.getTime()
			: null;
		const endMillis = endDate ? endDate.getTime() : null;

		// Extract the token from the request headers
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) {
			throw new Error("Authentication token is missing");
		}

		const data = {
			productSold: 0,
			totalRevenue: 0,
			unSettledRevenue: 0,
			settledRevenue: 0,
			returnPercentage: 0,
			returnProductQty: 0,
			rejectionPercentage: 0,
		};

		// Getting total revenue
		try {
			const totalTransactions =
				await shopTransactionRecords(acctNum, token);
			for (const transaction of totalTransactions) {
				if (
					(startMillis === null ||
						transaction.createdOn >= startMillis) &&
					(endMillis === null ||
						transaction.createdOn <= endMillis)
				) {
					data.totalRevenue += transaction.amount;
				}
			}
		} catch (error) {
			data.totalRevenue = 0;
		}

		// Getting unsettled revenue
		try {
			const unSettleTransactions =
				await shopUnsettleTransactions(acctNum, token);
			for (const transaction of unSettleTransactions) {
				if (
					(startMillis === null ||
						transaction.createdOn >= startMillis) &&
					(endMillis === null ||
						transaction.createdOn <= endMillis)
				) {
					data.unSettledRevenue += transaction.amount;
				}
			}
		} catch (error) {
			data.unSettledRevenue = 0;
		}

		// Getting settled revenue
		try {
			const settleTransactions =
				await shopSettleTransactions(acctNum, token);
			for (const transaction of settleTransactions) {
				if (
					(startMillis === null ||
						transaction.createdOn >= startMillis) &&
					(endMillis === null ||
						transaction.createdOn <= endMillis)
				) {
					data.settledRevenue += transaction.amount;
				}
			}
		} catch (error) {
			data.settledRevenue = 0;
		}

		// Get

		const soldProductQuery: any = {
			shop: shop._id,
			status: OrderStatus.DELIVERED,
			paymentStatus: OrderPaymentStatus.PAID,
			deliveryStatus: OrderDeliveryStatus.DELIVERED,
		};

		const rejectQuery: any = {
			shop: shop._id,
			status: OrderStatus.REJECTED,
		};

		const returnProductQuery: any = {
			shop: shop._id,
		};

		// Adjust end date to include the entire day
		if (endDate) {
			endDate.setHours(23, 59, 59, 999);
		}
		if (startDate && endDate) {
			soldProductQuery.createdAt = {
				$gte: startDate,
				$lte: endDate,
			};
			rejectQuery.createdAt = {
				$gte: startDate,
				$lte: endDate,
			};
			returnProductQuery.createdAt = {
				$gte: startDate,
				$lte: endDate,
			};
		} else if (startDate) {
			soldProductQuery.createdAt = { $gte: startDate };
			rejectQuery.createdAt = { $gte: startDate };
			returnProductQuery.createdAt = { $gte: startDate };
		} else if (endDate) {
			soldProductQuery.createdAt = { $lte: endDate };
			rejectQuery.createdAt = { $lte: endDate };
			returnProductQuery.createdAt = { $lte: endDate };
		}

		// Get shop orders
		const orders = await Order.find(
			soldProductQuery
		).populate({ path: "cartItem", select: "quantity" });

		// Getting sold products
		for (const order of orders) {
			if (order.cartItem) {
				// @ts-ignore
				data.productSold += order.cartItem.quantity;
			}
		}

		// Get rejected orders count
		const rejectedOrders = await Order.countDocuments(
			rejectQuery
		);

		// Get return counts
		const returnProducts = await ReturnProductModel.find({
			returnProductQuery,
		});
		data.returnProductQty = returnProducts.length;

		// Calculate return percentage
		if (data.productSold > 0) {
			data.returnPercentage =
				(data.returnProductQty / data.productSold) * 100;
		} else {
			data.returnPercentage = 0;
		}

		// Calculate rejection percentage
		const totalOrdersCount = orders.length + rejectedOrders;
		if (totalOrdersCount > 0) {
			data.rejectionPercentage =
				(rejectedOrders / totalOrdersCount) * 100;
		} else {
			data.rejectionPercentage = 0;
		}

		await Shop.findByIdAndUpdate(
			shop._id,
			{
				revenue: data.totalRevenue,
				unSettledRevenue: data.unSettledRevenue,
				settledRevenue: data.settledRevenue,
			},
			{
				new: true,
			}
		);

		return res.send(
			successResponse(
				"Your shop transaction records fetched successfully",
				data
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getVendorEnquiryGroup = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Extract user
		const { userId } = await getUserIdAndUser(req);
		// Get user shop
		const shop = await Shop.findOne({ user: userId });
		if (!shop) throw new NotFoundError("unauthorised user");
		// Get enquiry group
		const response = await VendorEnquiryGroup.find().select(
			"-types"
		);
		return res.send(
			successResponse(
				"Enquiry group fetched successfully",
				response
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getVendorEnquiryType = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Extract user
		const { userId } = await getUserIdAndUser(req);
		// Get user shop
		const shop = await Shop.findOne({ user: userId });
		if (!shop) throw new NotFoundError("unauthorised user");
		const id = req.params.id;
		// Get enquiry group
		const response = await VendorEnquiryGroup.findOne({
			_id: id,
		}).populate({
			path: "types",
			select: "_id name reasons",
			populate: {
				path: "reasons",
				select: "_id name",
			},
		});
		return res.send(
			successResponse(
				"Detail Enquiry group fetched successfully",
				response
			)
		);
	} catch (error) {
		next(error);
	}
};

export const sendEnquiry = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Extract user
		const { userId } = await getUserIdAndUser(req);
		// Get user shop
		const shop = await Shop.findOne({ user: userId });
		if (!shop) throw new NotFoundError("unauthorised user");

		// Extract payload
		let {
			email,
			enquiryTypeId,
			reasonId,
			documents,
			description,
			sku,
			orderId,
		} = req.body as SendEnquiryInput["body"];

		// Validate enquiry type
		const enquiryType = await VendorEnquiryType.findOne({
			_id: enquiryTypeId,
		});
		if (!enquiryType) {
			throw new NotFoundError("Invalid enquiry type");
		}
		// Validate reason
		const reason = await VendorEnquiryReason.findOne({
			_id: reasonId,
		});
		if (!reason) {
			throw new NotFoundError("Invalid enquiry reason");
		}
		const getUserInfo = await userNotificationInfo(userId);
		if (!getUserInfo.email && !email) {
			throw new NotFoundError("email is required");
		} else {
			email = getUserInfo.email;
		}
		// Create new enquiry
		const enquiry = new Enquiry({
			shopId: shop._id,
			email: email,
			enquiryTypeId: enquiryType._id,
			enquiryTypeText: enquiryType.name,
			reasonId: reason._id,
			reasonText: reason.name,
			documents: documents,
			description: description,
			sku,
			orderId,
		});
		await enquiry.save();
		return res.send(
			successResponse(
				"Your enquiry has been sent successfully",
				enquiry
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getMyEnquiries = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Extract user
		const { userId } = await getUserIdAndUser(req);

		// Get user shop
		const shop = await Shop.findOne({ user: userId });
		if (!shop) throw new NotFoundError("unauthorised user");

		// Get the status query
		const { status } = req.query;

		// Build the query object
		const query: any = { shopId: shop._id };
		if (status) query.status = status;

		// Get user enquiries based on the query
		const enquiries = await Enquiry.find(query).select(
			"_id status enquiryTypeText reasonText documents description sku orderId status createdAt"
		);

		return res.send(
			successResponse(
				"Your enquiry fetched successfully",
				enquiries
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getShopFAQs = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		// Extract user
		await getUserIdAndUser(req);
		// get faqs
		const faqs =
			await AdminShopFAQGroupModel.find().populate({
				path: "faqs",
			});
		return res.send(
			successResponse(
				"Fetched shop faqs successfully",
				faqs
			)
		);
	} catch (error) {
		next(error);
	}
};
