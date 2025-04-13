import mongoose, { Schema } from "mongoose";
//const mongoose = require("mongoose");
import { StatusTypes } from "../../utils/interfaces";

export interface IShop {
	_id: mongoose.Types.ObjectId;
	category: mongoose.Types.ObjectId;
	user: number;
	brand_name: string;
	official_email?: string;
	description: string;
	followers: number[];
	official_phone_number?: string;
	tierLevel: string;
	emailOn: boolean;
	pushNotifications: boolean;
	commentsOn: boolean;
	location?: {
		type?: string;
		coordinates?: number[];
	};
	address?: string;
	state?: mongoose.Types.ObjectId;
	lga?: string;
	landMark: string;
	products: mongoose.Types.ObjectId[];
	shopLogoName: string;
	status: string;
	adminAction?: {
		date: Date;
		reason?: string;
		status?: string;
		adminUser?: string;
	};
	shop_disputes?: mongoose.Types.ObjectId[];
	shopMembers?: mongoose.Types.ObjectId[];
	logoImageUrl?: string;
	backgroundImageUrl?: string;
	shopVisitCount?: {
		visitors: number[];
		visits: {
			count: number;
			time: Date;
		}[];
		newVisit: {
			count: number;
			time: Date;
		}[];
	};
	enableEmailNotification: boolean;
}

const geoJsonSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ["Point"],
		},
		coordinates: {
			type: [Number],
			index: "2dsphere",
		},
	},
	{ _id: false }
);

const UserVisitSchema = new mongoose.Schema(
	{
		visitors: [
			{
				type: Number,
				ref: "user",
			},
		],
		visits: [
			{
				count: {
					type: Number,
					default: 0,
				},
				time: {
					type: Date,
					required: true,
				},
			},
		],
		newVisit: [
			{
				count: {
					type: Number,
					default: 0,
				},
				time: {
					type: Date,
					required: true,
				},
			},
		],
	},
	{
		_id: false,
		timestamps: false,
	}
);

const ShopSchema = new mongoose.Schema(
	{
		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "category",
			required: true,
		},
		user: {
			type: Number,
			required: true,
			index: true,
		},
		brand_name: {
			type: String,
			required: true,
			unique: true,
		},
		official_email: {
			type: String,
		},
		description: {
			type: String,
			required: true,
		},
		followers: [{ type: Number }],
		official_phone_number: {
			type: String,
		},
		tierLevel: {
			type: String,
			enum: ["Tier 1", "Tier 2", "Tier 3"],
			default: "Tier 1",
		},
		emailOn: {
			type: Boolean,
			default: false,
		},
		pushNotifications: {
			type: Boolean,
			default: false,
		},
		commentsOn: {
			type: Boolean,
			default: false,
		},
		location: geoJsonSchema,
		address: {
			type: String,
		},
		state: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "state",
		},
		lga: {
			type: String,
			ref: "lga",
		},
		landMark: {
			type: String,
			default: null,
		},
		// delivery: {
		//   type: String,
		//   enum: ["state", "nationwide"],
		//   required: true,
		// },
		// rating: {},
		// reviews: {},
		products: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "product",
			},
		],
		shopLogoName: {
			type: String,
			default: null,
		},
		status: {
			type: String,
			enum: [
				StatusTypes.ACTIVE,
				StatusTypes.INACTIVE,
				StatusTypes.SUSPENDED,
				StatusTypes.DELETED,
				StatusTypes.DECLINED,
			],

			default: StatusTypes.INACTIVE,
			required: true,
		},
		adminAction: {
			date: {
				type: Date,
				default: Date.now,
			},
			reason: String,
			status: {
				type: String,
				enum: ["suspend", "reactivate"],
			},
			adminUser: {
				type: String,
			},
		},
		shop_disputes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "dispute",
			},
		],
		shopMembers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "shopMember",
			},
		],
		logoImageUrl: {
			type: String,
		},
		backgroundImageUrl: {
			type: String,
		},
		shopVisitCount: UserVisitSchema,
		enableEmailNotification: {
			type: Boolean,
			default: false,
		},
		revenue: {
			type: Number,
			default: 0,
		},
		unSettledRevenue: {
			type: Number,
			default: 0,
		},
		settledRevenue: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
		collections: "shops",
	}
);

export const Shop = mongoose.model("shop", ShopSchema);
