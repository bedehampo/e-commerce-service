import { NextFunction, Response } from "express";
import { successResponse } from "../helpers";
import {
	CustomRequest,
	StatusTypes,
} from "../utils/interfaces";
import { Deal, DealStatus } from "../model/shop/deal";
import { Category } from "../model/admin/category";
import { Shop } from "../model/shop/shop";
import { checkUserById } from "../middlewares/validators";
import { NotFoundError, ValidationError } from "../errors";
import locationsNg from "locations-ng";
import { checkAdminUser } from "../middlewares/validators";
import {
	getStatsYear,
	notificationService,
	sendEmailNotification,
	userNotificationInfo,
} from "../utils/global";
import {
	CalculateDeliveryInput,
	CompleteDealPaymentInput,
	CreateDealInput,
	DealRequestInput,
	DealsNearByInput,
	InitiateDealPaymentInput,
	UpdateDealInput,
	UpdateRequestInput,
} from "../validation/deal.schema";
import { State } from "../model/shop/state";
import mongoose from "mongoose";
import {
	DealPaymentStatus,
	DealRequest,
	DealRequestStatus,
} from "../model/shop/dealRequest";
import { addDays, startOfDay } from "date-fns";
import {
	OrderDeliveryStatus,
	OrderPaymentStatus,
} from "../types/order";
import sendMailNodeMailer from "../services/mail/sendEmailNodeMailer";
import { dealRequestTemplate } from "../services/mail/templates";
import { sendMessage } from "../services/sendMessage";
import {
	MulterFile,
	uploadBlobService,
} from "../services/UploadService";
import router from "../routes/event";
import {
	calculateDealDeliveryCost,
	completeDealPaymentService,
	initiateDealPaymentService,
} from "../services";
import { getUserIdAndUser } from "../services/product/productServices";

export const createDeal = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		const userId = req.user && req.user.id;
		const userService = req.userService;
		// await checkUserById(userId, userService);
		// console.log(req.user?.id);

		// image upload service
		// if (!req.files || req.files.length === 0) {
		// 	return next(new NotFoundError("No files uploaded"));
		// }
		const {
			image,
			category,
			productName,
			quantity,
			price,
			marketPrice,
			state,
			lga,
			description,
			latitude,
			longitude,
			address,
		} = req.body as CreateDealInput["body"];
		// confirm if category is valid
		const categoryExit = await Category.findById(category);
		if (!categoryExit)
			throw new NotFoundError("category not found");
		// confirm if state and lga exit
		const stateExit = await State.findOne({
			_id: state,
			lgas: { $in: [lga] },
		});
		if (!stateExit)
			throw new NotFoundError("state or lga not found");

		// Check if the user already has a deal with the same productName
		const existingDeal = await Deal.findOne({
			userId: userId,
			productName: {
				$regex: new RegExp("^" + productName + "$", "i"),
			},
		});
		if (existingDeal)
			throw new ValidationError(
				"A deal with the same product name already exists for this user"
			);

		const userDeals = await Deal.find({
			userId: userId,
			status: DealStatus.Active,
		});
		if (userDeals.length > 5)
			throw new ValidationError(
				"You have reached the maximum number of active deals(5)"
			);
		const newQuantity = Number(quantity);
		const newPrice = Number(price);
		let discount;
		const newMarketPrice = Number(marketPrice);
		if (newPrice <= newMarketPrice) {
			discount = Math.ceil(
				((newMarketPrice - newPrice) / newMarketPrice) * 100
			);
		} else {
			discount = 0;
		}
		const newDeal = new Deal({
			userId,
			image,
			category,
			productName,
			quantity: newQuantity,
			price: newPrice,
			marketPrice: newMarketPrice,
			discount: discount,
			state,
			lga,
			description,
			location: {
				type: "Point",
				coordinates: [Number(longitude), Number(latitude)],
			},
			address,
		});
		// const files = req.files;
		// const result = await Promise.all(
		// 	// @ts-ignore
		// 	files.map(uploadBlobService)
		// );
		// newDeal.image = result;
		await newDeal.save({ session });
		await session.commitTransaction();
		session.endSession();
		return res.send(
			successResponse("deal created successfully", newDeal)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

export const dealRequest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		const { firstName, lastName, mobileNumber } =
			await checkUserById(userId, userService);
		const { dealId, quantity, amount } =
			req.body as DealRequestInput["body"];
		const dealExit = await Deal.findOne({
			_id: dealId,
			status: DealStatus.Active,
		});
		// ensuring user don't request their own deals
		if (dealExit.userId == userId)
			throw new ValidationError(
				"you can't request your own deal"
			);
		// check if the deal exit
		if (!dealExit)
			throw new NotFoundError("deal not found");
		// validating the request quantity
		if (dealExit.quantity < quantity)
			throw new ValidationError(
				"your selected quantity is greater than available quantity"
			);
		// check if user have pending request for this deal
		const existingRequest = await DealRequest.findOne({
			dealId: dealExit._id,
			userId: userId,
		});
		if (
			existingRequest &&
			existingRequest.status == "pending"
		) {
			throw new ValidationError(
				"You currently have an existing pending request for this deal, kindly edit to effect new changes"
			);
		} else if (
			existingRequest &&
			existingRequest.status == "rejected"
		) {
			throw new ValidationError(
				"You currently have an existing rejected request for this deal, kindly edit to request again"
			);
		}
		const totalAmount = Number(amount) * Number(quantity);
		const newRequest = new DealRequest({
			dealId,
			userId,
			quantity,
			amount,
			totalAmount,
		});
		await newRequest.save();
		dealExit.requests.push(newRequest._id);
		await dealExit.save();
		// get  deal owner details
		const dealOwner = await checkUserById(
			dealExit.userId,
			userService
		);
		const message = `Dear  ${dealOwner.firstName} ${
			dealOwner.lastName
		}\n,We are excited to inform you that ${firstName} ${lastName} has expressed interest in your deal ${JSON.stringify(
			dealExit.productName
		)}.\nPlease review the request and respond at your earliest convenience.\nBest regards,\nMotoPay E-commerce`;

		// send notification to the deal owner
		await notificationService(
			"MotoPay",
			dealOwner,
			"New Deal Request Notification",
			message
		);

		// send Notification to other bidders alerting them of a new deal bid
		const dealRequests = await DealRequest.find({
			dealId: dealId,
			status: DealRequestStatus.Ongoing,
			userId: { $ne: userId },
		});
		for (const dealRequest of dealRequests) {
			const bidder = await userNotificationInfo(
				dealRequest.userId
			);
			const message = `Dear ${bidder.firstName},\n\nWe wanted to let you know that a new bid has been placed on the deal you are interested in: ${dealExit.productName}\nTo secure this deal, please consider making your payment as soon as possible\nBest regards,\nMotoPay E-commerce`;
			await notificationService(
				"MotoPay",
				bidder,
				`New Bid Placed on ${dealExit.productName}`,
				message
			);
		}

		return res.send(
			successResponse(
				"deal request submitted successfully",
				newRequest
			)
		);
	} catch (error) {
		next(error);
	}
};

export const acceptRequest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const requestId = req.params.id;
		// get the request
		const request = await DealRequest.findById(requestId);
		if (!request)
			throw new NotFoundError("request not found");
		// confirming user owns the deal
		const deal = await Deal.findOne({
			userId,
			_id: request.dealId,
		});
		const requester = await checkUserById(
			request.userId,
			userService
		);
		if (!deal)
			throw new ValidationError("user not the deal owner");
		request.status = DealRequestStatus.Ongoing;
		await request.save();

		// Send notification to the deal requester
		await notificationService(
			"MotoPay",
			requester,
			"Your Deal Request Has Been Accepted",
			`We are excited to inform you that your request for the deal ${JSON.stringify(
				deal.productName
			)} has been accepted.\nPlease log in to your account to view the details and proceed further.\nBest regards,\nMotoPay E-commerce`
		);

		return res.send(
			successResponse("Deal request accepted", request)
		);
	} catch (error) {
		next(error);
	}
};

export const rejectRequest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const requestId = req.params.id;
		// get the request
		const request = await DealRequest.findById(requestId);
		if (!request)
			throw new NotFoundError("request not found");
		// confirming user owns the deal
		const deal = await Deal.findOne({
			userId,
			_id: request.dealId,
		});
		const requester = await checkUserById(
			request.userId,
			userService
		);
		if (!deal)
			throw new ValidationError("user not the deal owner");
		request.status = DealRequestStatus.Rejected;
		await request.save();

		// Send notification to the deal requester
		await notificationService(
			"MotoPay",
			requester,
			"Your Deal Request Has Been Rejected",
			`We regret to inform you that your request for the deal ${JSON.stringify(
				deal.productName
			)} has been rejected.\nPlease log in to your account to explore other available deals.\nBest regards,\nMotoPay E-commerce`
		);

		return res.send(
			successResponse("Deal request rejected", request)
		);
	} catch (error) {
		next(error);
	}
};

export const nearByDeals = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		const longitude: number | undefined = Number(
			req.query.longitude
		);
		const latitude: number | undefined = Number(
			req.query.latitude
		);
		const searchQuery: string | undefined = req.query
			.search as string;
		const categoryQuery: string | undefined = req.query
			.category
			? req.query.category.toString()
			: undefined;
		const minPrice: number | undefined = req.query.minPrice
			? Number(req.query.minPrice)
			: undefined;
		const maxPrice: number | undefined = req.query.maxPrice
			? Number(req.query.maxPrice)
			: undefined;
		const stateQuery: string | undefined = req.query.state
			? req.query.state.toString()
			: undefined;

		const buildDealFilterConditions = (params: {
			query?: string;
			category?: string;
			minPrice?: number;
			maxPrice?: number;
			state?: string;
		}) => {
			const filters = [];

			if (params.query) {
				filters.push({
					$or: [
						{
							productName: {
								$regex: params.query,
								$options: "i",
							},
						},
						{
							description: {
								$regex: params.query,
								$options: "i",
							},
						},
					],
				});
			}

			if (params.category) {
				filters.push({
					category: new mongoose.Types.ObjectId(
						params.category
					),
				});
			}

			if (
				!isNaN(params.minPrice) &&
				!isNaN(params.maxPrice)
			) {
				filters.push({
					price: {
						$gte: params.minPrice,
						$lte: params.maxPrice,
					},
				});
			}

			if (params.state) {
				filters.push({
					state: params.state,
				});
			}

			return filters;
		};

		const filters = buildDealFilterConditions({
			query: searchQuery,
			category: categoryQuery,
			minPrice: minPrice,
			maxPrice: maxPrice,
			state: stateQuery,
		});

		let pipeline = [];

		if (longitude !== undefined && latitude !== undefined) {
			pipeline.push({
				$geoNear: {
					near: {
						type: "Point",
						coordinates: [longitude, latitude],
					},
					maxDistance: 30000,
					spherical: true,
					distanceField: "dist.calculated",
					includeLocs: "dist.location",
				},
			});
		}

		if (filters.length > 0) {
			pipeline.push({ $match: { $and: filters } });
		}

		pipeline.push({
			$match: {
				$and: [
					{ userId: { $ne: userId } },
					{ status: DealStatus.Active },
				],
			},
		});

		const results = await Deal.aggregate(
			pipeline
		).allowDiskUse(true);

		const updateNearByDeals = await Promise.all(
			results.map(async (deal) => {
				const { firstName, lastName, profilePhotoUrl } =
					await checkUserById(deal.userId, userService);
				const category = await Category.findById(
					deal.category
				);
				const state = await State.findById(deal.state);
				return {
					...deal,
					category: {
						_id: category?._id,
						name: category?.name,
					},
					state: {
						_id: state?._id,
						name: state?.name,
					},
					postedBy: {
						profilePhotoUrl,
						firstName,
						lastName,
					},
				};
			})
		);

		return res.send(
			successResponse(
				"Deals nearby fetched successfully",
				updateNearByDeals
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getDeals = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		// Extract search parameters from the request query
		const searchQuery: string | undefined = req.query
			.search as string;
		const categoryQuery: string | undefined = req.query
			.category as string;
		const minPrice: number | undefined = Number(
			req.query.minPrice
		);
		const maxPrice: number | undefined = Number(
			req.query.maxPrice
		);
		const stateQuery: string | undefined = req.query
			.state as string;

		// Build the base query excluding the user's own deals
		const baseQuery = {
			userId: { $ne: userId },
			status: DealStatus.Active,
		};

		// Add search criteria to the query if provided
		const dealsQuery: any = searchQuery
			? {
					...baseQuery,
					$or: [
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
					],
			  }
			: baseQuery;

		// Add category criteria to the query if provided
		if (categoryQuery) {
			dealsQuery.category = new mongoose.Types.ObjectId(
				categoryQuery
			);
		}

		// Add price range criteria to the query if provided
		if (minPrice && maxPrice) {
			if (!isNaN(minPrice) && !isNaN(maxPrice)) {
				dealsQuery.price = {
					$gte: Number(minPrice),
					$lte: Number(maxPrice),
				};
			}
		}

		// Add state criteria to the query if provided
		if (stateQuery) {
			dealsQuery.state = stateQuery;
		}

		// Fetch deals based on the constructed query
		const deals = await Deal.find(dealsQuery)
			.select("-requests")
			.populate({
				path: "category",
				select: "name _id",
			})
			.populate({
				path: "state",
				select: "name _id",
			});

		// Attaching deal user firstName, lastName, profilePhotoUrl
		const updateDeals = await Promise.all(
			deals.map(async (deal) => {
				const { firstName, lastName, profilePhotoUrl } =
					await checkUserById(deal.userId, userService);
				return {
					...deal.toObject(),
					postedBy: {
						profilePhotoUrl,
						firstName,
						lastName,
					},
				};
			})
		);

		// Customize the response based on your needs
		return res.send(
			successResponse(
				"Deals retrieved successfully",
				updateDeals
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleDeal = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const id = req.params.id;

		// Fetch deals based on the constructed query
		const deal = await Deal.findOne({
			_id: id,
			status: DealStatus.Active,
			userId: { $ne: userId },
		})
			.select("-requests")
			.populate({
				path: "category",
				select: "name _id",
			})
			.populate({
				path: "state",
				select: "name _id",
			});

		if (!deal) throw new NotFoundError("deal not found");

		// Fetch user details and attach them to the deal
		const { firstName, lastName, profilePhotoUrl } =
			await checkUserById(deal.userId, userService);

		// Attach user details to the deal
		const updatedDeal = {
			...deal.toObject(),
			postedBy: {
				profilePhotoUrl,
				firstName,
				lastName,
			},
		};

		// Customize the response based on your needs
		return res.send(
			successResponse(
				"Deal retrieved successfully",
				updatedDeal
			)
		);
	} catch (error) {
		next(error);
	}
};

export const recentDeals = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		// Extract search parameters from the request query
		const searchQuery: string | undefined = req.query
			.search as string;
		const categoryQuery: string | undefined = req.query
			.category as string;
		const minPrice: number | undefined = Number(
			req.query.minPrice
		);
		const maxPrice: number | undefined = Number(
			req.query.maxPrice
		);
		const stateQuery: string | undefined = req.query
			.state as string;
		// Calculate the date 7 days ago from the current day
		const sevenDaysAgo = startOfDay(
			addDays(new Date(), -7)
		);

		// Fetch deals created within the last 7 days

		const baseQuery = {
			userId: { $ne: userId },
			createdAt: { $gte: sevenDaysAgo },
			status: DealStatus.Active,
		};

		// Add search criteria to the query if provided
		const dealsQuery: any = searchQuery
			? {
					...baseQuery,
					$or: [
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
					],
			  }
			: baseQuery;

		// Add category criteria to the query if provided
		if (categoryQuery) {
			dealsQuery.category = new mongoose.Types.ObjectId(
				categoryQuery
			);
		}

		// Add price range criteria to the query if provided
		if (minPrice && maxPrice) {
			if (!isNaN(minPrice) && !isNaN(maxPrice)) {
				dealsQuery.price = {
					$gte: Number(minPrice),
					$lte: Number(maxPrice),
				};
			}
		}

		// Add state criteria to the query if provided
		if (stateQuery) {
			dealsQuery.state = stateQuery;
		}

		const deals = await Deal.find(dealsQuery)
			.select("-requests")
			.populate({
				path: "category",
				select: "name _id",
			})
			.populate({
				path: "state",
				select: "name _id",
			});
		//    attaching deal user firstName, lastName, profilePhotoUrl
		const updateDeals = await Promise.all(
			deals.map(async (deal) => {
				const { firstName, lastName, profilePhotoUrl } =
					await checkUserById(deal.userId, userService);
				return {
					...deal.toObject(),
					postedBy: {
						profilePhotoUrl,
						firstName,
						lastName,
					},
				};
			})
		);

		return res.send(
			successResponse(
				"Recent deals retrieved successfully",
				updateDeals
			)
		);
	} catch (error) {
		next(error);
	}
};

export const myDeals = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const { status } = req.query;

		let myDeals;

		if (status === "closed" || status === "active") {
			myDeals = await Deal.find({
				userId: userId,
				status,
			})
				.populate({
					path: "category",
					select: "name _id",
				})
				.populate({
					path: "state",
					select: "name _id",
				});
		} else {
			myDeals = await Deal.find({
				userId: userId,
				status: { $ne: DealStatus.Deleted },
			})
				.populate({
					path: "category",
					select: "name _id",
				})
				.populate({
					path: "state",
					select: "name _id",
				});
		}
		return res.send(
			successResponse(
				`My deals (${status || "all"})`,
				myDeals
			)
		);
	} catch (error) {
		next(error);
	}
};

export const mySingleDeal = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const id = req.params.id;

		let myDeal = await Deal.findOne({
			userId: userId,
			_id: id,
			status: { $ne: DealStatus.Deleted },
		})
			.populate({
				path: "category",
				select: "name _id",
			})
			.populate({
				path: "state",
				select: "name _id",
			})
			.populate({
				path: "requests",
			});

		if (!myDeal) {
			throw new NotFoundError("Deal not found");
		}

		const getUserDetails = async (userId) => {
			const user = await checkUserById(userId, userService);
			if (user) {
				return {
					profilePhotoUrl: user.profilePhotoUrl,
					firstName: user.firstName,
					lastName: user.lastName,
				};
			}
			return {};
		};

		// Fetch additional details for each request in the deal
		const updatedDeal = {
			...myDeal.toObject(),
			requests: await Promise.all(
				myDeal.requests.map(async (request) => {
					// Call toObject() on the request, not on the result of findById

					const userRequest = await DealRequest.findById(
						request
					);
					const requestObject = userRequest.toObject();
					const userDetails = await getUserDetails(
						userRequest.userId
					);
					return {
						...requestObject,
						userDetails,
					};
				})
			),
		};

		return res.send(
			successResponse(
				"Deal retrieve successfully",
				updatedDeal
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteMyDeal = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const id = req.params.id;

		// Find the deal
		const deal = await Deal.findOne({
			_id: id,
			userId: userId,
		});

		// Check if the deal exists
		if (!deal || deal.status == "deleted") {
			throw new NotFoundError("Deal not found");
		}

		// Check if any deal request has a payment status of "paid"
		const hasPaidRequests = await DealRequest.find({
			dealId: deal._id,
			paymentStatus: OrderPaymentStatus.PAID,
		});

		if (hasPaidRequests.length > 0) {
			// If any deal request has a payment status of "paid," prevent deletion
			throw new ValidationError(
				`Cannot delete the deal. ${hasPaidRequests.length} requests have a paid status.`
			);
		}
		// If no deal request has a payment status of "paid," proceed with the deletion
		deal.status = DealStatus.Deleted;
		await deal.save();

		// Send notification to all users that have requested this deal
		const dealRequests = await DealRequest.find({
			dealId: id,
			paymentStatus: DealPaymentStatus.PENDING,
		});
		console.log("The request", dealRequests);
		for (const dealRequest of dealRequests) {
			const user = await userNotificationInfo(
				dealRequest.userId
			);
			console.log(user);
			await notificationService(
				"MotoPay",
				user,
				"Deal Unavailable Notification",
				`We regret to inform you that the deal ${JSON.stringify(
					deal.productName
				)} you expressed interest in has been deleted. We encourage you to check our platform for other similar available deals that might interest you.\nThank you for your understanding.\n\nBest regards,\nMotoPay E-commerce`
			);
		}

		return res.send(
			successResponse("Deal deleted successfully", deal)
		);
	} catch (error) {
		next(error);
	}
};

export const updateMyDeal = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		// if (!req.files || req.files.length === 0) {
		// 	return next(new NotFoundError("No files uploaded"));
		// }

		const {
			dealId,
			image,
			category,
			productName,
			quantity,
			price,
			marketPrice,
			state,
			lga,
			description,
			latitude,
			longitude,
			address,
		} = req.body as UpdateDealInput["body"];

		const getDeal = await Deal.findOne({
			_id: dealId,
			userId: userId,
			status: "active",
		});
		if (!getDeal) throw new NotFoundError("Deal not found");

		const dealRequests = await DealRequest.find({
			dealId: getDeal._id,
		});
		if (dealRequests.length > 0) {
			throw new ValidationError(
				"Requests have already been made on this deal. Delete or create a new one."
			);
		}

		const categoryExist = await Category.findById(category);
		if (!categoryExist)
			throw new NotFoundError("Category not found");

		const stateExist = await State.findOne({
			_id: state,
			lgas: { $in: [lga] },
		});
		if (!stateExist)
			throw new NotFoundError("State or LGA not found");

		const userDeals = await Deal.find({
			userId: userId,
			status: DealStatus.Active,
		});
		if (userDeals.length > 5) {
			throw new ValidationError(
				"You have reached the maximum number of active deals (5)."
			);
		}

		const newQuantity = Number(quantity);
		const newPrice = Number(price);
		let discount;
		const newMarketPrice = Number(marketPrice);
		if (newPrice <= newMarketPrice) {
			discount = Math.ceil(
				((newMarketPrice - newPrice) / newMarketPrice) * 100
			);
		} else {
			discount = 0;
		}

		const updatedDeal = await Deal.findByIdAndUpdate(
			getDeal._id,
			{
				image,
				category,
				productName,
				quantity: newQuantity,
				price: newPrice,
				marketPrice: newMarketPrice,
				discount: discount,
				state,
				lga,
				description,
				location: {
					type: "Point",
					coordinates: [
						Number(longitude),
						Number(latitude),
					],
				},
				address,
			},
			{ new: true }
		);

		// const files = req.files;
		// const result = await Promise.all(
		// 	// @ts-ignore
		// 	files.map(uploadBlobService)
		// );

		// updatedDeal.image = result;
		await updatedDeal.save({ session });
		await session.commitTransaction();
		session.endSession();

		return res.send(
			successResponse(
				"Deal updated successfully",
				updatedDeal
			)
		);
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
};

export const viewMySentRequests = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const status = req.query.status;
		let dealRequests;
		if (
			status === "pending" ||
			status === "ongoing" ||
			status === "completed" ||
			status === "rejected"
		) {
			dealRequests = await DealRequest.find({
				userId: userId,
				status: status,
			}).populate({
				path: "dealId",
				select: "-requests",
				populate: [
					{ path: "category", select: "_id name" },
					{ path: "state", select: "_id name" },
				],
			});
		} else {
			dealRequests = await DealRequest.find({
				userId: userId,
			}).populate({
				path: "dealId",
				populate: [
					{ path: "category", select: "_id name" },
					{ path: "state", select: "_id name" },
				],
			});
		}

		if (!dealRequests)
			throw new NotFoundError("deal requests not found");
		return res.send(
			successResponse(
				"Sent request retrieved",
				dealRequests
			)
		);
	} catch (error) {
		next(error);
	}
};

export const viewMySingleSentRequest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const id = req.params.id;

		const dealRequests = await DealRequest.findOne({
			_id: id,
			userId: userId,
		}).populate({
			path: "dealId",
			select: "-requests",
			populate: [
				{ path: "category", select: "_id name" },
				{ path: "state", select: "_id name" },
			],
		});

		if (!dealRequests)
			throw new NotFoundError("deal requests not found");
		return res.send(
			successResponse(
				"Single sent request retrieved",
				dealRequests
			)
		);
	} catch (error) {
		next(error);
	}
};

export const viewMyReceivedRequest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const status = req.query.status;
		const deals = await Deal.find({
			userId: userId,
		});

		const dealIds = deals.map((deal) => deal._id);
		const dealRequests = await DealRequest.find({
			dealId: { $in: dealIds },
		}).populate({
			path: "dealId",
			populate: [
				{ path: "category", select: "_id name" },
				{ path: "state", select: "_id name" },
			],
		});
		if (!dealRequests)
			throw new NotFoundError("deal request not found");
		// fetching additional details for each deal request
		const updatedDealRequest = await Promise.all(
			dealRequests.map(async (dealRequest) => {
				const { firstName, lastName, profilePhotoUrl } =
					await checkUserById(
						dealRequest.userId,
						userService
					);
				return {
					...dealRequest.toObject(),
					requestBy: {
						firstName,
						lastName,
						profilePhotoUrl,
					},
				};
			})
		);
		let finalRequests;
		if (
			status === "pending" ||
			status === "ongoing" ||
			status === "completed"
		) {
			const statuses = Array.isArray(status)
				? status
				: [status];
			finalRequests = updatedDealRequest.filter((deal) =>
				statuses.includes(deal.status)
			);
		} else {
			finalRequests = updatedDealRequest.filter(
				(deal) => deal.status !== "rejected"
			);
		}

		return res.send(
			successResponse(
				"Received Deal request retrieved successfully",
				finalRequests
			)
		);
	} catch (error) {
		next(error);
	}
};

export const viewMySingleReceivedRequest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const id = req.params.id;
		const deals = await Deal.find({
			userId: userId,
		}).select("_id");
		const dealIds = deals.map((deal) => deal._id);
		const dealRequest = await DealRequest.findOne({
			_id: id,
			dealId: { $in: dealIds },
		}).populate({
			path: "dealId",
			populate: [
				{ path: "category", select: "_id name" },
				{ path: "state", select: "_id name" },
			],
		});
		if (!dealRequest)
			throw new NotFoundError("deal request not found");
		const { firstName, lastName, profilePhotoUrl } =
			await checkUserById(dealRequest.userId, userService);
		// Combine user details with dealRequest data
		const responseData = {
			...dealRequest.toObject(),
			requestBy: {
				firstName,
				lastName,
				profilePhotoUrl,
			},
		};

		return res.send(
			successResponse(
				"Single received Deal request retrieved successfully",
				responseData
			)
		);
	} catch (error) {
		next(error);
	}
};

export const updateMyRequest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		const user = await checkUserById(userId, userService);
		const { requestId, quantity, amount } =
			req.body as UpdateRequestInput["body"];
		const dealRequest = await DealRequest.findOne({
			_id: requestId,
			status: DealRequestStatus.Rejected,
		});
		if (!dealRequest)
			throw new NotFoundError("deal not found");
		const deal = await Deal.findById(dealRequest.dealId);
		const dealOwner = await checkUserById(
			deal.userId,
			userService
		);
		// Update the dealRequest properties
		dealRequest.quantity = quantity;
		dealRequest.amount = amount;
		dealRequest.status = DealRequestStatus.Pending;
		await dealRequest.save();
		// Notify the deal owner of the bidder's update
		const message = `Dear  ${dealOwner.firstName} ${dealOwner.lastName},\nWe wanted to inform you that ${user.firstName} has updated their bid on your deal :${deal.productName}.\n\nPlease log in to your account to review the updated bid and take any necessary actions.\nBest regards,\nMotoPay E-commerce.`;

		// send notification to the deal owner
		await notificationService(
			"MotoPay",
			dealOwner,
			"Deal Request Update Notification",
			message
		);
		return res.send(
			successResponse(
				"Your deal request updated successfully",
				dealRequest
			)
		);
	} catch (error) {
		next(error);
	}
};

export const deleteMyRequest = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const id = req.params.id;

		console.log("Before", id);

		const myRequest = await DealRequest.findOne({
			_id: id,
			userId: userId,
			status: { $ne: DealRequestStatus.Deleted },
		});
		if (!myRequest)
			throw new NotFoundError("Deal request not found");
		console.log("After", id);
		// validating deal request status
		if (
			myRequest &&
			myRequest.paymentStatus == OrderPaymentStatus.PAID &&
			myRequest.deliveryStatus !=
				OrderDeliveryStatus.DELIVERED
		) {
			throw new ValidationError(
				"can't delete undelivered paid deal request."
			);
		}
		myRequest.status = DealRequestStatus.Deleted;
		await myRequest.save();
		// Send notification to deal owner
		const dealId = myRequest.dealId;
		const deal = await Deal.findById(dealId);
		const dealOwner = await userNotificationInfo(
			deal.userId
		);
		const requester = await userNotificationInfo(userId);
		console.log(requester);
		await notificationService(
			"MotoPay",
			dealOwner,
			"Deal Request Deletion Notification",
			`We regret to inform you that ${
				requester.firstName
			} has deleted their request for your deal ${JSON.stringify(
				deal.productName
			)}.\nPlease log in to your account to review your remaining active requests and manage your deals accordingly.\nBest regards,\nMotoPay E-commerce`
		);

		return res.send(
			successResponse(
				"Deal request deleted successfully",
				myRequest
			)
		);
	} catch (error) {
		next(error);
	}
};

export const calculateDeliveryPrice = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		const data = req.body;
		const {
			deliveryAddress,
			receiversName,
			receiversPhoneNumber,
			deliveryAddressDescription,
			dealRequestId,
		} = data as CalculateDeliveryInput["body"];
		const userId = req.user && req.user.id;

		session.startTransaction();
		const result = await calculateDealDeliveryCost(
			data,
			userId,
			session,
			req.userService
		);
		return res.send(
			successResponse(
				"Delivery prices retrieved successfully",
				result
			)
		);
		//
	} catch (error) {
		next(error);
	}
};

export const initiateDealPayment = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		const data = req.body;

		const userId = req.user && req.user.id;
		const result = await initiateDealPaymentService(
			data,
			userId,
			session,
			req.userService,
			req.transactionService
		);
		return res.send(
			successResponse("Deal payment initiated", result)
		);
	} catch (error) {
		next(error);
	}
};

export const completeDealPayment = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	const session = await mongoose.startSession();
	try {
		const data = req.body;
		const userId = req.user && req.user.id;
		const { transactionReference, pin } =
			data as CompleteDealPaymentInput["body"];

		session.startTransaction();
		const result = await completeDealPaymentService(
			transactionReference,
			userId,
			pin,
			session,
			req.userService,
			req.transactionService
		);
		// User payment notification
		const buyer = await userNotificationInfo(userId);
		await notificationService(
			"MotoPay",
			buyer,
			"Deal Payment Successful!",
			"Your payment for the recent deal has been successfully processed. Thank you for your purchase!"
		);
		// Vendor payment notification
		const dealRequest = await DealRequest.findOne({
			transactionReference: transactionReference,
		});
		// get deal owner id
		const deal = await Deal.findOne({
			_id: dealRequest.dealId,
		});
		const dealOwner = await userNotificationInfo(
			deal.userId
		);
		const message = `You have received a payment for your deal name ${deal.productName}. Please check your MotoPay app for more details. Thank you for using MotoPay E-commerce`;
		await notificationService(
			"MotoPay",
			dealOwner,
			"Deal Payment Received!",
			message
		);

		return res.send(
			successResponse(
				"Deal payment completed successfully",
				result
			)
		);
	} catch (error) {
		next(error);
	}
};

export const lowDealStock = async () => {
	try {
		
		// get deal low on stock
		const deals = await Deal.find({
			quantity: { $lt: 3 },
		});
		console.log("Get products", deals);
		// Extract user Ids
		const extractUserIdsPromise = deals.map(
			async (deal) => {
				const userId = deal.userId;
				const user = await userNotificationInfo(userId);
				// Construct the notification message
				const message = `Dear ${user.firstName},\n\nWe hope this message finds you well. We wanted to inform you that one of your deal, ${deal.productName}, is running low on stock. As of now, there are only ${deal.quantity} units left in inventory.\n\nPlease consider restocking this product to ensure uninterrupted availability for your customers.\n\n`;
				await notificationService(
					"MotoPay",
					user,
					`Deal Low Stock Alert: ${deal.productName}`,
					message
				);
			}
		);
		await Promise.all(extractUserIdsPromise);
	} catch (error) {
		console.log(error);
	}
};

export const noDealStock = async () => {
	try {
		// get deal with  on stock
		const deals = await Deal.find({
			quantity: 0,
		});
		// Extract User Ids
		const extractUserIdsPromise = deals.map(
			async (deal) => {
				const userId = deal.userId;
				const user = await userNotificationInfo(userId);
				// Construct the notification message
				const message = `Dear ${user.firstName},\n\nWe hope this message finds you well. We wanted to inform you that one of your deal, ${deal.productName}, has run out of stock and is currently unavailable for purchase. Please consider restocking this product to ensure continuous availability for your customers.`;
				// Send the notification
				await notificationService(
					"MotoPay",
					user,
					`Deal Out of Stock Alert: ${deal.productName}`,
					message
				);
			}
		);
		await Promise.all(extractUserIdsPromise);
	} catch (error) {
		console.log(error);
	}
};
