import { NextFunction, Response, query } from "express";
import { successResponse } from "../helpers";
import {
	CustomRequest,
	StatusTypes,
} from "../utils/interfaces";
import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from "../errors";
import { DisputeModel } from "../model/shop/dispute";
import { checkUserById } from "../middlewares/validators";
import { Shop } from "../model/shop/shop";
import { Order } from "../model/shop/order";
import mongoose, { Schema } from "mongoose";
import { CartItem } from "../model/shop/cartItem";
import { Product } from "../model/shop/product";
import { differenceInDays } from "date-fns";
import {
	OrderDeliveryStatus,
	OrderPaymentStatus,
	OrderStatus,
} from "../types/order";
import {
	AcceptDisputeInput,
	DisputeInput,
	RejectDisputeInput,
	RejectionReasonInput,
} from "../validation/dispute.schema";
import { vendor } from "sharp";
import { checkShopPermission } from "../middlewares/checkShopPermission";
import { ShopAction } from "../model/shop/shopActions";
import { uploadBlobService } from "../services/UploadService";
import { getUserIdAndUser } from "../services/product/productServices";
import { DisputeReasonModel } from "../model/shop/shopDisputeReason";
import { UserDeliveryAddress } from "../model/shop/userDeliveryAddress";
import { OrderGroup } from "../model/shop/OrderGroup";
import { Cart } from "../model/shop/cart";
import {
	notificationService,
	userNotificationInfo,
} from "../utils/global";

// creating a dispute - customer
export const createDispute = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	// const session = await mongoose.startSession();

	try {
		// session.startTransaction();
		const { userId } = await getUserIdAndUser(req);

		let { orderID, type, description, evidence, address } =
			req.body as DisputeInput["body"];

		// check the dispute type
		const disputeType = await DisputeReasonModel.findById(
			type
		);
		if (!disputeType)
			throw new NotFoundError(
				"Dispute type id is not valid"
			);

		// checking if the order belong to the user
		const order = await Order.findOne({
			_id: orderID,
			user: userId,
		});

		if (!order) throw new NotFoundError("Order not found");

		// check if order is paid for
		if (
			order.paymentStatus != OrderPaymentStatus.PAID ||
			order.deliveryStatus !=
				OrderDeliveryStatus.DELIVERED ||
			order.status != OrderStatus.DELIVERED
		) {
			throw new ValidationError(
				"Can't dispute this order, call customer care"
			);
		}

		// Check if the delivery date is within the allowed dispute duration
		const disputeDurationDays = disputeType.duration; // Assuming disputeType has a 'duration' field representing the number of days
		const daysSinceDelivery = differenceInDays(
			new Date(),
			order.deliveryDate
		);

		if (daysSinceDelivery > disputeDurationDays) {
			throw new ValidationError(
				"Cannot create a dispute, the dispute period has expired."
			);
		}

		const shop = await Shop.findById(order.shop);
		if (!shop) throw new NotFoundError("Shop not found");

		// check if it a valid delivery address
		const userAddress = await UserDeliveryAddress.findOne({
			userId: userId,
			addresses: {
				$elemMatch: {
					_id: new mongoose.Types.ObjectId(address),
				},
			},
		});
		if (!userAddress) {
			throw new NotFoundError("Invalid user address");
		}

		// checking if a dispute already exist
		const hasDispute = await DisputeModel.findOne({
			orderID: orderID,
			customerID: userId,
		});
		if (hasDispute)
			throw new ValidationError(
				"Dispute already exist for this order, call customer care"
			);

		const newDispute = new DisputeModel({
			orderID: order._id,
			shopID: shop._id,
			customerID: userId,
			type,
			description,
			evidence,
			address,
		});

		// const response = await uploadBlobService(req.file);
		// await newDispute.evidence.push(response);
		await newDispute.save();

		shop.shop_disputes.push(newDispute._id);
		await shop.save();

		// await session.commitTransaction();
		// session.endSession();
		return res.send(
			successResponse(
				"Dispute created successfully",
				newDispute
			)
		);
	} catch (error) {
		// await session.abortTransaction();
		// session.endSession();
		next(error);
	}
};

// Get all disputes - shop owner (vendor)
interface ShopQuery {
	shopID: mongoose.Types.ObjectId;
	status?: string;
}

interface CustomerQuery {
	customerID: number;
	status?: string;
}

export const shopDisputes = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		// getting shop if
		const shopId = req.params.id;

		await checkShopPermission(
			userId,
			shopId.toString(),
			"disputes"
		);

		// validating shop owner
		const shop = await Shop.findOne({
			_id: shopId,
			status: StatusTypes.ACTIVE,
		});

		if (!shop)
			throw new NotFoundError("active shop not found");

		const { status } = req.query;

		const query: ShopQuery = { shopID: shop._id };

		if (status === "requested") {
			query.status = "requested";
		} else if (status === "approved") {
			query.status = "approved";
		} else if (status === "rejected") {
			query.status = "rejected";
		} else if (status === "received") {
			query.status = "received";
		} else if (status === "refunded") {
			query.status = "refunded";
		} else if (status === "completed") {
			query.status = "completed";
		}

		// getting disputes based on query, and populating the 'orderID' field to retrieve the 'price' property
		const responses = await DisputeModel.find(query)
			.populate({
				path: "orderID",
				select: "price -_id cartItem",
				populate: {
					path: "cartItem",
					select: "product",
					populate: {
						path: "product",
						select: "productName _id",
					},
				},
			})
			.populate({
				path: "type",
				select: "_id name",
			})
			.populate({
				path: "shopID",
				select: "brand_name",
			});

		//  customer name - price shop name, dispute type, date

		// Counting the number of disputes for each status
		const requestedCount = responses.filter(
			(dispute) => dispute.status === "requested"
		).length;
		const progressCount = responses.filter(
			(dispute) => dispute.status === "approved"
		).length;
		const completedCount = responses.filter(
			(dispute) => dispute.status === "completed"
		).length;

		const rejectedCount = responses.filter(
			(dispute) => dispute.status === "rejected"
		).length;

		const approvedCount = responses.filter(
			(dispute) => dispute.status === "approved"
		).length;

		// formatting the response to display
		const disputes = await Promise.all(
			responses.map(async (dispute) => {
				const user = await userNotificationInfo(
					dispute.customerID
				);
				// Ensure that productName is correctly assigned
				const productName =
					// @ts-ignore
					dispute.orderID.cartItem?.product?.productName ||
					"N/A";
				return {
					_id: dispute._id,
					customer: `${user.firstName} ${user.lastName}`,
					//@ts-ignore
					productName: productName,
					//@ts-ignore
					price: dispute.orderID.price,
					//@ts-ignore
					brand_name: dispute.shopID.brand_name,
					// @ts-ignore
					disputeType: dispute.type.name,
					status: dispute.status,
					date: dispute.createdAt,
				};
			})
		);

		const disputeCount = await DisputeModel.countDocuments({
			shopID: shop._id,
		});

		// getting count based on query
		const count = {
			pending: requestedCount,
			progress: progressCount,
			completed: completedCount,
			approvedCount: approvedCount,
			rejectedCount: rejectedCount,
			disputeCount: disputeCount,
		};
		const shopAction = new ShopAction({
			user: userId,
			action: "viewed shop disputes",
			shop: shopId,
		});
		await shopAction.save();

		return res.send(
			successResponse("Disputes fetched successfully", {
				disputes,
				count,
			})
		);
	} catch (error) {
		next(error);
	}
};

// Get single dispute - shop owner (vendor)
export const shopSingleDispute = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		const { shopId, disputeId } = req.params;

		await checkShopPermission(
			userId,
			shopId.toString(),
			"disputes"
		);
		// validating shop owner
		const hasShop = await Shop.findOne({
			_id: shopId,
			status: StatusTypes.ACTIVE,
		});
		if (!hasShop) throw new NotFoundError("Shop not found");

		const dispute = await DisputeModel.findOne({
			_id: disputeId,
			shopID: shopId,
		}).populate({
			path: "type",
			select: "_id name",
		});
		if (!dispute)
			throw new NotFoundError("Dispute not found");
		// Get the cart item
		const order = await Order.findOne({
			_id: dispute.orderID,
		});
		if (!order) throw new NotFoundError("invalid order");

		// Fetch the order group related to the order in the dispute
		const orderGroup = await OrderGroup.findOne({
			orders: { $in: [dispute.orderID] },
		}).populate({
			path: "deliveryMerchant",
			select: "name",
		});

		if (!orderGroup) {
			throw new NotFoundError("Order Group not found");
		}

		// Get the cart item
		const cart = await CartItem.findOne({
			_id: order.cartItem,
		});

		if (!cart) throw new NotFoundError("Invalid cart item");

		const product = await Product.findOne({
			_id: cart.product,
		});

		if (!product)
			throw new NotFoundError("Invalid product");
		// product image, name, description, price, dispute type, description, document, date, status
		return res.send(
			successResponse("Dispute fetched successfully", {
				dispute: {
					_id: dispute._id,
					productImages: cart.selectColorImage.images,
					productName: product.productName,
					productDescription: product.productDescription,
					price: order.price,
					// @ts-ignore
					disputeType: dispute.type.name,
					description: dispute.description,
					date: dispute.createdAt,
					status: dispute.status,
					evidence: dispute.evidence,
				},
			})
		);
	} catch (error) {
		next(error);
	}
};

// Accept dispute
export const acceptDispute = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const { shopId, disputeId } = req.params;

		await checkShopPermission(
			userId,
			shopId.toString(),
			"disputes"
		);

		const doesShopExit = await Shop.findOne({
			_id: shopId,
			status: StatusTypes.ACTIVE,
		});
		if (!doesShopExit)
			throw new NotFoundError("Shop not found");
		const dispute = await DisputeModel.findOne({
			_id: disputeId,
			shopID: shopId,
			status: "requested",
		});
		if (!dispute)
			throw new NotFoundError("dispute not found");
		dispute.status = "approved";
		// Notify user about their dispute
		await notificationService(
			"Motopay",
			dispute.customerID,
			"Accept Dispute",
			"Your dispute has being accepted successfully"
		);
		await dispute.save();
		return res.send(
			successResponse(
				"Dispute accepted successfully",
				dispute
			)
		);
	} catch (error) {
		next(error);
	}
};

export const rejectDispute = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);
		const { shopId, disputeId } = req.params;
		const { rejectionReason, rejectionDoc } =
			req.body as RejectionReasonInput["body"];

		await checkShopPermission(
			userId,
			shopId.toString(),
			"disputes"
		);

		const doesShopExit = await Shop.findOne({
			_id: shopId,
			status: StatusTypes.ACTIVE,
		});
		if (!doesShopExit)
			throw new NotFoundError("Shop not found");
		const dispute = await DisputeModel.findOne({
			_id: disputeId,
			shopID: shopId,
			status: "requested",
		});
		if (!dispute)
			throw new NotFoundError("dispute not found");
		dispute.status = "rejected";
		dispute.rejectionReason = rejectionReason;
		if (rejectionDoc) {
			dispute.rejectionDoc = rejectionDoc;
		}
		// Notify user about their dispute
		await notificationService(
			"Motopay",
			dispute.customerID,
			"Accept Dispute",
			"Your dispute has being accepted successfully"
		);
		await dispute.save();
		return res.send(
			successResponse(
				"Dispute accepted successfully",
				dispute
			)
		);
	} catch (error) {
		next(error);
	}
};

// Get all disputes - customer
export const customerDisputes = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);

		const query: CustomerQuery = {
			customerID: userId,
		};

		const { status } = req.query;

		if (status === "requested") {
			query.status = "requested";
		} else if (status === "approved") {
			query.status = "approved";
		} else if (status === "rejected") {
			query.status = "rejected";
		} else if (status === "received") {
			query.status = "received";
		} else if (status === "refunded") {
			query.status = "refunded";
		} else if (status === "completed") {
			query.status = "completed";
		}

		const disputes = await DisputeModel.find(query)
			.select("_id status createdAt")
			.populate({
				path: "orderID",
				select: "_id price",
				populate: {
					path: "cartItem",
					select: "_id selectColorImage",
					populate: {
						path: "product",
						select: "productName productDescription",
					},
				},
			});

		const formattedDisputes = disputes.map((dispute) => {
			return {
				_id: dispute._id,
				productImages:
					//@ts-ignore
					dispute.orderID?.cartItem?.selectColorImage
						.images || null,
				productName:
					//@ts-ignore
					dispute.orderID?.cartItem?.product?.productName ||
					null,
				description:
					//@ts-ignore
					dispute.orderID?.cartItem?.product
						?.productDescription || null,
				//@ts-ignore
				price: dispute.orderID?.price || null,
				status: dispute.status,
				createdAt: dispute.createdAt,
			};
		});

		const count = await DisputeModel.countDocuments(query);

		return res.send(
			successResponse("Disputes fetched successfully", {
				disputes: formattedDisputes,
				count,
			})
		);
	} catch (error) {
		next(error);
	}
};

// Get single dispute - customer
// export const customerSingleDisputes = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		const userService = req.userService;
// 		await checkUserById(userId, userService);

// 		const { disputeID } = req.params;

// 		// Find the dispute with the given ID and user's ID
// 		const dispute = await DisputeModel.findOne({
// 			_id: disputeID,
// 			customerID: userId,
// 		})
// 			.select(
// 				"_id status createdAt type description evidence"
// 			)
// 			.populate({
// 				path: "orderID",
// 				select: "_id cartItem",
// 				populate: [
// 					{
// 						path: "cartItem",
// 						select: "selectColorImage product",
// 						populate: [
// 							{
// 								path: "product",
// 								select: "_id productName description",
// 							},
// 							{
// 								path: "selectColorImage.color",
// 								select: "images",
// 							},
// 						],
// 					},
// 				],
// 			})
// 			.populate({
// 				path: "shopID",
// 				select: "brand_name",
// 			})
// 			.populate({
// 				path: "type",
// 				select: "name",
// 			});

// 		if (!dispute) {
// 			throw new NotFoundError("Dispute not found");
// 		}

// 		// Fetch the order group related to the order in the dispute
// 		const orderGroup = await OrderGroup.findOne({
// 			orders: dispute.orderID._id,
// 		}).populate({
// 			path: "deliveryMerchant",
// 			select: "name",
// 		});

// 		if (!orderGroup) {
// 			throw new NotFoundError("Order Group not found");
// 		}
//         //@ts-ignore
// 		const cartItem = dispute.orderID.cartItem;
// 		const product = cartItem.product;

// 		return res.send(
// 			successResponse("Dispute fetched successfully", {
// 				dispute: {
// 					_id: dispute._id,
// 					status: dispute.status,
// 					date: dispute.createdAt,
// 					deliveryAgent:
// 						//@ts-ignore
// 						orderGroup.deliveryMerchant?.name || null,
// 					riderName: null,
// 					productImages:
// 						cartItem.selectColorImage.images || [],
// 					productName: product.productName,
// 					productDescription: product.productDescription,
// 					//@ts-ignore
// 					shopName: dispute.shopID.brand_name,
// 					//@ts-ignore
// 					disputeType: dispute.type.name,
// 					description: dispute.description,
// 					evidence: dispute.evidence,
// 				},
// 			})
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };
export const customerSingleDisputes = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.user && req.user.id;
		const userService = req.userService;
		await checkUserById(userId, userService);

		const { disputeID } = req.params;

		// Find the dispute with the given ID and user's ID
		const dispute = await DisputeModel.findOne({
			_id: disputeID,
			customerID: userId,
		})
			.select(
				"_id status createdAt type description evidence"
			)
			.populate({
				path: "orderID",
				select: "_id cartItem",
				populate: {
					path: "cartItem",
					select: "selectColorImage product",
					populate: {
						path: "product",
						select: "_id productName description",
					},
				},
			})
			.populate({
				path: "shopID",
				select: "brand_name",
			})
			.populate({
				path: "type",
				select: "name",
			});

		if (!dispute) {
			throw new NotFoundError("Dispute not found");
		}

		// Get the cart item
		const order = await Order.findOne({
			_id: dispute.orderID,
		});
		if (!order) throw new NotFoundError("invalid order");

		// Fetch the order group related to the order in the dispute
		const orderGroup = await OrderGroup.findOne({
			orders: { $in: [dispute.orderID] },
		}).populate({
			path: "deliveryMerchant",
			select: "name",
		});

		if (!orderGroup) {
			throw new NotFoundError("Order Group not found");
		}

		// Get the cart item
		const cart = await CartItem.findOne({
			_id: order.cartItem,
		});

		if (!cart) throw new NotFoundError("Invalid cart item");

		const product = await Product.findOne({
			_id: cart.product,
		});

		if (!product)
			throw new NotFoundError("Invalid product");

		return res.send(
			successResponse("Dispute fetched successfully", {
				dispute: {
					_id: dispute._id,
					status: dispute.status,
					price: order.price,
					date: dispute.createdAt,
					//@ts-ignore
					deliveryAgent: orderGroup.deliveryMerchant.name,
					riderName: null,
					productImages: cart.selectColorImage.images,
					productName: product.productName,
					productDescription: product.productDescription,
					//@ts-ignore
					shopName: dispute.shopID.brand_name,
					//@ts-ignore
					disputeType: dispute.type.name,
					description: dispute.description,
					evidence: dispute.evidence,
				},
			})
		);
	} catch (error) {
		next(error);
	}
};

// export const customerSingleDisputes = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		const userService = req.userService;
// 		await checkUserById(userId, userService);

// 		const { disputeID } = req.params;

// 		// Find the dispute with the given ID and user's ID
// 		const dispute = await DisputeModel.findOne({
// 			_id: disputeID,
// 			customerID: userId,
// 		})
// 			.select("_id status")
// 			.populate({
// 				path: "orderID",
// 				select: "_id cartItem",
// 				populate: {
// 					path: "cartItem",
// 					select: "_id selectColorImage.images",
// 				},
// 			});

// 		// .populate("type", "_id name");

// 		// if (!dispute) {
// 		// 	throw new NotFoundError("Dispute not found");
// 		// }

// 		// // Find the associated order for the dispute
// 		// const order = await Order.findById(dispute.orderID);

// 		// if (!order) {
// 		// 	throw new NotFoundError("Order not found");
// 		// }

// 		// // Find the cart item details
// 		// const cartItem = await CartItem.findById(
// 		// 	order.cartItem
// 		// );

// 		// if (!cartItem) {
// 		// 	throw new NotFoundError("Cart Item not found");
// 		// }

// 		// // Find the product details
// 		// const product = await Product.findById(
// 		// 	cartItem.product
// 		// );

// 		// if (!product) {
// 		// 	throw new NotFoundError("Product not found");
// 		// }

// 		// // Find the OrderGroup containing the order and populate deliveryMerchant
// 		// const orderGroup = await OrderGroup.findOne({
// 		// 	orders: order._id,
// 		// }).populate("deliveryMerchant", "-_id name");

// 		// if (!orderGroup) {
// 		// 	throw new NotFoundError("Order Group not found");
// 		// }

// 		// const { productName, productDescription, price } =
// 		// 	product;

// 		// return res.send(
// 		// 	successResponse("Dispute fetched successfully", {
// 		// 		dispute: {
// 		// 			_id: dispute._id,
// 		// 			status: dispute.status,
// 		// 			createdAt: dispute.createdAt,
// 		// 			type: dispute.type,
// 		// 			productDetails: {
// 		// 				productName,
// 		// 				productDescription,
// 		// 				price,
// 		// 			},
// 		// 			merchantName:
// 		// 				orderGroup.deliveryMerchant?.name || null,
// 		// 		},
// 		// 	})
// 		// );
// 		return res.send(
// 			successResponse("Dispute fetched successfully", {
// 				dispute: {
// 					_id: dispute._id,
// 					status: dispute.status,
// 					productImages:
// 						//ts-ignore
// 						dispute.orderID.cartItem.selectColorImage
// 							.images,
// 				},
// 			})
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const customerSingleDisputes = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		const userService = req.userService;
// 		await checkUserById(userId, userService);
// 		const { disputeID } = req.params;
// 		let productData;
// 		let merchantData;
// 		// getting all disputes
// 		const dispute = await DisputeModel.findOne({
// 			_id: disputeID,
// 			customerID: userId,
// 		})
// 			.populate(
// 				"shopID",
// 				"shopLogoUrl brand_name official_phone_number official_email"
// 			)
// 			.populate({
// 				path: "type",
// 				select: "_id name",
// 			});
// 		if (dispute) {
// 			const order = await Order.findById({
// 				_id: dispute.orderID,
// 			});
// 			if (order) {
// 				const cartItem = await CartItem.findById({
// 					_id: order.cartItem,
// 				});
// 				const orderGroup = await OrderGroup.findOne({
// 					orders: order._id,
// 				}).populate({
// 					path: "deliveryMerchant",
// 					select: "-_id name",
// 				});
// 				if (orderGroup) {
// 					merchantData = orderGroup;
// 				}
// 				if (cartItem) {
// 					const product = await Product.findById({
// 						_id: cartItem.product,
// 					});
// 					if (product) {
// 						productData = product;
// 					} else {
// 						throw new NotFoundError("Product not found");
// 					}
// 				} else {
// 					throw new NotFoundError("Cart Item not found");
// 				}
// 			} else {
// 				throw new NotFoundError("Order not found");
// 			}
// 		} else {
// 			throw new NotFoundError("Dispute not found");
// 		}
// 		let { productName, productDescription, productPrice } =
// 			productData;

// 		return res.send(
// 			successResponse("Disputes fetched successfully", {
// 				dispute: dispute,
// 				productDetails: {
// 					productName: productName,
// 					productDescription: productDescription,
// 					productPrice: productPrice,
// 				},
// 			})
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// Reject a dispute - shop owner (vendor)
// export const rejectDispute = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		const userService = req.userService;
// 		await checkUserById(userId, userService);

// 		const { shopId, disputeId, vendorResponse } =
// 			req.body as RejectDisputeInput["body"];

// 		await checkShopPermission(
// 			userId,
// 			shopId.toString(),
// 			"reject_disputes"
// 		);

// 		const shop = await Shop.findOne({
// 			_id: shopId,
// 			status: StatusTypes.ACTIVE,
// 		});

// 		if (!shop)
// 			throw new ValidationError("active shop not found");

// 		// validating is the user is the vendor
// 		const dispute = await DisputeModel.findOne({
// 			_id: disputeId,
// 			shopID: shopId,
// 			status: "pending",
// 		});

// 		if (!dispute)
// 			throw new ValidationError("Dispute not found");

// 		// updating the dispute
// 		dispute.vendorAction.action = "rejected";
// 		dispute.vendorAction.comment = vendorResponse;
// 		await dispute.save();
// 		const shopAction = new ShopAction({
// 			user: userId,
// 			action: "reject_disputes",
// 			shop: shopId,
// 		});
// 		await shopAction.save();

// 		return res.send(
// 			successResponse(
// 				"Dispute accepted successfully",
// 				dispute
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// Accept a dispute - shop owner (vendor)
// export const acceptDispute = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		const userService = req.userService;
// 		await checkUserById(userId, userService);

// 		const { shopId, disputeId, vendorResponse } =
// 			req.body as AcceptDisputeInput["body"];

// 		await checkShopPermission(
// 			userId,
// 			shopId.toString(),
// 			"accept_disputes"
// 		);

// 		const shop = await Shop.findOne({
// 			_id: shopId,
// 			status: StatusTypes.ACTIVE,
// 		});

// 		if (!shop)
// 			throw new ValidationError("active shop not found");

// 		// validating is the user is the vendor
// 		const dispute = await DisputeModel.findOne({
// 			_id: disputeId,
// 			shopID: shopId,
// 			status: "pending",
// 		});

// 		if (!dispute)
// 			throw new ValidationError("Dispute not found");

// 		// updating the dispute
// 		dispute.vendorAction.action = "accepted";
// 		dispute.vendorAction.comment = vendorResponse;
// 		dispute.status = "progress";
// 		await dispute.save();
// 		const shopAction = new ShopAction({
// 			user: userId,
// 			action: "accept_disputes",
// 			shop: shopId,
// 		});
// 		await shopAction.save();

// 		return res.send(
// 			successResponse(
// 				"Dispute accepted successfully",
// 				dispute
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const resolvedDispute = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		const userService = req.userService;
// 		await checkUserById(userId, userService);

// 		const { disputeId } = req.params;

// 		const shop = await Shop.findOne({
// 			user: userId,
// 		});

// 		if (!shop) throw new NotFoundError("Shop not found");

// 		// validating is the user is the vendor
// 		const dispute = await DisputeModel.findOne({
// 			_id: disputeId,
// 			shopID: shop._id,
// 		});

// 		if (!dispute)
// 			throw new ValidationError("Dispute not found");

// 		if (
// 			dispute.status === "progress" &&
// 			dispute.vendorAction.action === "accepted"
// 		) {
// 			dispute.vendorAction.action = "resolved";
// 			await dispute.save();
// 		} else {
// 			throw new Error("authorised operation");
// 		}

// 		return res.send(
// 			successResponse(
// 				"Dispute accepted successfully",
// 				dispute
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// Re-Open a dispute - shop owner (vendor)
// export const reOpenDispute = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		const userService = req.userService;
// 		await checkUserById(userId, userService);

// 		const { disputeID } = req.params;

// 		const shop = await Shop.findOne({
// 			user: userId,
// 		});

// 		if (!shop) throw new NotFoundError("Shop not found");

// 		// validating is the user is the vendor
// 		const dispute = await DisputeModel.findOne({
// 			_id: disputeID,
// 			shopID: shop._id,
// 		});

// 		if (!dispute)
// 			throw new ValidationError("Validation error");

// 		if (dispute.userAction.action != "complaint")
// 			throw new ValidationError(
// 				"Can't re-open this dispute"
// 			);
// 		// updating the dispute
// 		const updatedDispute =
// 			await DisputeModel.findByIdAndUpdate(
// 				disputeID,
// 				{
// 					vendorAction: "re-opened",
// 					vendorResponse: "",
// 				},
// 				{ new: true }
// 			);
// 		return res.send(
// 			successResponse("Dispute rejected", updatedDispute)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// Close a dispute - customer
// export const closeDispute = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user && req.user.id;
// 		const userService = req.userService;
// 		await checkUserById(userId, userService);

// 		const { disputeID, userResponse } = req.body;

// 		if (!disputeID || !userResponse)
// 			throw new ValidationError("This field is required");

// 		// checking if the order belong to the user
// 		const dispute = await DisputeModel.findOne({
// 			_id: disputeID,
// 			customerID: userId,
// 		});

// 		if (!dispute)
// 			throw new NotFoundError("Dispute not found");

// 		if (dispute.status == "completed")
// 			throw new ValidationError(
// 				"This dispute is closed already"
// 			);
// 		dispute.status = "completed";
// 		dispute.userAction.action = "closed";
// 		dispute.userAction.comment = userResponse;
// 		await dispute.save();

// 		return res.send(
// 			successResponse("Dispute closed", dispute)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// Escalate a dispute - customer
// export const escalateDispute = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const userId = req.user?.id;
// 		const userService = req.userService;
// 		await checkUserById(userId, userService);

// 		const { disputeID, userResponse } = req.body;

// 		if (!disputeID || !userResponse) {
// 			throw new ValidationError("This field is required");
// 		}

// 		// Checking if the order belongs to the user
// 		const dispute = await DisputeModel.findOne({
// 			_id: disputeID,
// 			customerID: userId,
// 		});

// 		if (!dispute) {
// 			throw new NotFoundError("Dispute not found");
// 		}

// 		// Checking the dispute days
// 		let disputeCreatedAt: Date = dispute.createdAt;
// 		const now = new Date();

// 		const millisecondsInADay = 1000 * 60 * 60 * 24;

// 		const daysSinceCreated = Math.floor(
// 			(now.getTime() - disputeCreatedAt.getTime()) /
// 				millisecondsInADay
// 		);

// 		if (
// 			(dispute.status === "pending" &&
// 				dispute.vendorAction.action === null &&
// 				daysSinceCreated >= 10) ||
// 			dispute.vendorAction.action === "rejected" ||
// 			(dispute.status === "progress" &&
// 				dispute.vendorAction.action === "accepted" &&
// 				daysSinceCreated >= 10)
// 		) {
// 			dispute.userAction.action = "complaint";
// 			dispute.userAction.comment = userResponse;
// 			await dispute.save();
// 			return res.send(
// 				successResponse(
// 					"Dispute complaint submitted successfully",
// 					dispute
// 				)
// 			);
// 		} else {
// 			throw new ValidationError(
// 				"You can't escalate this dispute yet"
// 			);
// 		}
// 	} catch (error) {
// 		next(error);
// 	}
// };

export const getDisputeReasons = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const disputeReasons =
			await DisputeReasonModel.find().select("name _id");
		return res.send(
			successResponse(
				"Dispute reasons fetch successfully",
				disputeReasons
			)
		);
	} catch (error) {
		next(error);
	}
};

export const getSingleDisputeReason = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
		const id = req.params.id;
		const disputeReason = await DisputeReasonModel.findById(
			id
		).select("name _id");

		if (!disputeReason)
			throw new NotFoundError("dispute reason not found");

		return res.send(
			successResponse(
				"Dispute reason fetch successfully",
				disputeReason
			)
		);
	} catch (error) {
		next(error);
	}
};

export const transactionAmountSuggestion = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = await getUserIdAndUser(req);
	} catch (error) {
		next(error);
	}
};
