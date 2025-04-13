import mongoose from "mongoose";
import { ProductStatus } from "../../types/shop";
import { nanoid } from "nanoid";

const wholeSaleSchema = new mongoose.Schema({
	quantity: {
		type: Number,
		enum: [5, 10, 20, 30, 40, 50],
	},
	price: Number,
});

const ProductSchema = new mongoose.Schema(
	{
		sku: {
			type: String,
			required: true,
			unique: true,
		},
		productImages: {
			type: [
				{
					color: {
						type: mongoose.Schema.Types.ObjectId,
						ref: "colours",
					},
					images: {
						type: [String],
						min: 1,
						max: 4,
					},
					quantity: { type: Number },
				},
			],
			min: 1,
		},
		shop: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "shop",
			required: true,
		},
		productCategory: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "subcategory",
			required: true,
		},
		productShopCategory: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "category",
			required: true,
		},
		productDescription: {
			type: String,
			required: true,
		},
		keyFeature: {
			type: String,
		},
		productName: {
			type: String,
			required: true,
		},
		actualPrice: {
			type: Number,
			required: true,
			float: true,
			default: 0.0,
		},
		// negotiable: {
		// 	type: Boolean,
		// 	default: false,
		// },
		sales: {
			type: Boolean,
			default: false,
		},
		discountRate: {
			type: Number,
			float: true,
			max: 100,
			min: 0,
			default: 0.0,
		},
		discountAmount: {
			type: Number,
			float: true,
			default: 0.0,
		},
		productPrice: {
			type: Number,
			float: true,
		},
		stockQuantity: {
			type: Number,
			required: true,
			default: 0,
		},
		quantitySold: {
			type: Number,
			default: 0,
		},
		wholeSale: [wholeSaleSchema],
		cashBackPercentage: {
			type: Number,
			float: true,
			default: 0.0,
			min: 0.0,
			max: 2,
			// required: true,
		},
		userVisits: [Number],
		tags: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "hashtags",
			},
		],
		status: {
			type: String,
			enum: [
				ProductStatus.VERIFIED,
				ProductStatus.UNVERIFIED,
				ProductStatus.DELETED,
				ProductStatus.DECLINED,
				ProductStatus.OUT_OF_STOCK,
			],
			required: true,
			default: ProductStatus.VERIFIED,
		},
		views: [Number],
		popularityScore: {
			type: Number,
			default: 0,
		},
		reviews: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "review",
			},
		],
		variations: [
			{
				name: String,
				values: [],
			},
		],
		properties: [
			{
				name: String,
				value: String,
			},
		],
		customFields: [
			{
				name: String,
				value: String,
			},
		],
		deliveryCoverage: {
			type: String,
			enum: ["state", "nationwide"],
		},
		shopActions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "shopAction",
			},
		],
		adminProductTags: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "admin-product-section",
			default: null,
		},
	},
	{
		timestamps: true,
		collection: "products",
	}
);

export const Product = mongoose.model(
	"product",
	ProductSchema
);
