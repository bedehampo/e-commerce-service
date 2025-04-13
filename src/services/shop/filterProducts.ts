import mongoose from "mongoose";

import { StatusTypes } from "../../utils/interfaces";
import { Product } from "../../model/shop/product";
import { WishList } from "../../model/shop/wishlist";
import { successResponse } from "../../helpers";
import { type } from "os";
import { FilterProductInput } from "../../validation/product.schema";
import { Shop } from "../../model/shop/shop";
import { ProductStatus } from "../../types/shop";

const filterProducts = async (
	params: FilterProductInput["params"],
	userId: number
) => {
	const makeFilterConditions = async (
		params: FilterProductInput["params"]
	) => {
		const ands = [];

		if (params.search) {
			ands.push({
				$or: [
					{
						productName: {
							$regex: params.search,
							$options: "i",
						},
					},
					{
						productDescription: {
							$regex: params.search,
							$options: "i",
						},
					},
				],
			});
		}
		if (params.category && !params.sub_category) {
			ands.push({
				productShopCategory: new mongoose.Types.ObjectId(
					params.category
				),
			});
		}
		if (params.category && params.sub_category) {
			ands.push({
				productCategory: new mongoose.Types.ObjectId(
					params.sub_category
				),
			});
		}
		if (!params.category && params.sub_category) {
			ands.push({
				productCategory: new mongoose.Types.ObjectId(
					params.sub_category
				),
			});
		}

		if (params.min_price)
			ands.push({
				productPrice: { $gte: Number(params.min_price) },
			});
		if (params.max_price)
			ands.push({
				productPrice: { $lte: Number(params.max_price) },
			});

		if (params.state) {
			ands.push({
				"shop.state": new mongoose.Types.ObjectId(
					params.state
				),
			});
		}

		return ands;
	};
	const ands = await makeFilterConditions(params);
	const match = { $and: ands };

	let pipeline = [];

	//populate with shop model
	let pipelinePayload = [
		{
			$lookup: {
				from: "shops",
				localField: "shop",
				foreignField: "_id",
				as: "shop",
			},
		},
		{
			$unwind: "$shop",
		},
		{
			$match: {
				//active shops and match by location
				$and: [
					{ "shop.status": StatusTypes.ACTIVE },
					{ "shop.user": { $ne: userId } },
					{ status: ProductStatus.VERIFIED },
					// { "shop.state": new mongoose.Types.ObjectId(params.state) },
				],
			},
		},

		//check if product is in user's wishlist, the product model does not have a wishlist field so we need to do a lookup on the wishlist model
		{
			$lookup: {
				from: "wishlists",
				let: { productId: "$_id" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $eq: ["$userId", userId] },
									{ $in: ["$$productId", "$items"] },
								],
							},
						},
					},
				],
				as: "wishlist",
			},
		},

		//add a field to indicate if the product is in the user's wishlist
		{
			$addFields: {
				isInWishlist: {
					$cond: {
						if: { $eq: [{ $size: "$wishlist" }, 0] },
						then: false,
						else: true,
					},
				},
			},
		},

		//remove wishlist field
		{
			$unset: "wishlist",
		},
	];
	const offset = Number(
		Number(params.per_page) * (Number(params.page) - 1)
	);

	const results = [
		{ $skip: offset },
		{ $limit: Number(params.per_page) },
	];

	if (ands.length > 0) {
		pipeline.push({ $match: match });
	}

	let reviewPayload = [
		{
			$lookup: {
				from: "ratings_reviews",
				localField: "reviews",
				foreignField: "_id",
				as: "reviews",
			},
		},
		{
			$addFields: {
				averageRating: {
					$avg: "$reviews.rating",
				},
			},
		},

		{
			$match: {
				averageRating: { $gte: Number(params.rating) },
			},
		},
	];

	reviewPayload = params.rating ? [...reviewPayload] : [];

	pipeline = [
		...pipelinePayload,
		...pipeline,
		...reviewPayload,

		// {
		//   $addFields: {
		//     shop: "$shop._id",
		//   },
		// },
		{
			$sort: {
				// popularityScore: -1,
				createdAt: -1,
			},
		},
		{
			$facet: {
				results,
				pageInfo: [
					{ $group: { _id: null, count: { $sum: 1 } } },
					{
						$addFields: {
							limit: Number(params.per_page),
						},
					},
					{ $project: { _id: 0 } },
				],
			},
		},
	];

	let products: any = await Product.aggregate(
		pipeline
	).allowDiskUse(true);
	let productsResult = products[0];

	//remake pageInfo as an object
	productsResult.pageInfo = productsResult.pageInfo[0];
	return productsResult;
};

export default filterProducts;
