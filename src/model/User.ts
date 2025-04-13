// import mongoose, { Schema } from "mongoose";
// import config from "../config";
// import { FlagTypes } from "../utils/interfaces";

// const verificationCodesSchema = new mongoose.Schema({
// 	code: {
// 		type: Number,
// 		required: false,
// 	},
// 	expires_at: {
// 		type: Date,
// 		required: false,
// 	},
// });
// const userAllowedDevicesSchema = new mongoose.Schema(
// 	{
// 		deviceId: {
// 			type: String,
// 			required: false,
// 		},
// 		userAgent: {
// 			type: String,
// 			required: false,
// 		},
// 		lastAccessedAt: {
// 			type: Date,
// 			default: Date.now,
// 		},
// 	},
// 	{
// 		_id: false,
// 		timestamps: false,
// 	}
// );

// const userSessionsSchema = new mongoose.Schema(
// 	{
// 		deviceId: {
// 			type: String,
// 			required: false,
// 		},
// 		userAgent: {
// 			type: String,
// 			required: false,
// 		},
// 		token: {
// 			type: String,
// 			required: false,
// 		},
// 		flag: {
// 			type: String,
// 			enum: [FlagTypes.TWO_FACTOR_AUTH, FlagTypes.LOGIN],
// 		},
// 	},
// 	{
// 		_id: false,
// 		timestamps: true,
// 	}
// );

// const OtpSchema: Schema = new Schema(
// 	{
// 		otp: {
// 			type: String,
// 			default: null,
// 		},
// 		code_expires_at: {
// 			type: Date,
// 		},
// 	},
// 	{
// 		_id: false,
// 	}
// );

// const phoneNumberSchema: Schema = new Schema(
// 	{
// 		country: {
// 			type: String,
// 			required: true,
// 		},
// 		countryCallingCode: {
// 			type: String,
// 			required: true,
// 		},
// 		nationalNumber: {
// 			type: String,
// 			required: true,
// 		},
// 		number: {
// 			type: String,
// 			required: true,
// 		},
// 	},
// 	{
// 		_id: false,
// 	}
// );

// const UserSchema = new mongoose.Schema(
// 	{
// 		avatar: { type: String, default: null },
// 		firstName: { type: String, default: "" },
// 		lastName: { type: String, default: "" },
// 		followings: [
// 			{
// 				type: mongoose.Schema.ObjectId,
// 				ref: "user",
// 			},
// 		],
// 		followers: [
// 			{
// 				type: mongoose.Schema.ObjectId,
// 				ref: "user",
// 			},
// 		],
// 		followingCount: {
// 			type: Number,
// 			default: 0,
// 		},
// 		followerCount: {
// 			type: Number,
// 			default: 0,
// 		},
// 		gender: {
// 			type: String,
// 			enum: ["male", "female"],
// 		},
// 		mototag: {
// 			type: String,
// 			default: "",
// 		},
// 		phoneNumber: {
// 			type: phoneNumberSchema,
// 			required: true,
// 		},
// 		profilePictureName: {
// 			type: String,
// 			default: null,
// 		},
// 		profilePictureUrl: {
// 			type: String,
// 			default: null,
// 		},
// 		phoneVerified: { type: Boolean, default: false },
// 		email: {
// 			type: String,
// 			default: "",
// 		},
// 		emailverified: { type: Boolean, default: false },
// 		password: { type: String, required: true },
// 		address: { type: String, default: "" },
// 		addressVerified: {
// 			type: Boolean,
// 			default: false,
// 		},
// 		referralCode: {
// 			type: String,
// 		},
// 		referredBy: {
// 			type: Schema.Types.ObjectId,
// 			ref: "user",
// 		},
// 		beneficiaries: [
// 			{
// 				type: Schema.Types.ObjectId,
// 				ref: "user",
// 			},
// 		],
// 		bio: {
// 			type: String,
// 			default: null,
// 		},
// 		dob: { type: Date, default: null },
// 		status: {
// 			type: String,
// 			enum: ["pending", "active", "suspended", "closed"],
// 			default: "pending",
// 		},
// 		tier: {
// 			type:String,
// 			enum:["tier 1", "tier 2", "tier 3"],
// 			default:"tier 1"
// 		},
// 		pin: {
// 			type: String,
// 			default: null,
// 		},
// 		isSetPin: {
// 			type: Boolean,
// 			default: false,
// 		},
// 		tempPin: {
// 			type: String,
// 			default: null,
// 		},
// 		twoFactorEnabled: {
// 			type: Boolean,
// 			default: false,
// 		},
// 		kycComplete: { type: Boolean, default: false },
// 		otp: { type: OtpSchema },
// 		bvn: { type: String, default: "" },
// 		bvnVerified: { type: Boolean, default: false },
// 		otherDocument: { type: String, default: null },
// 		verifyOtherDocument: { type: Boolean, default: false },
// 		mainWallet: {
// 			type: Schema.Types.ObjectId,
// 			ref: "mainWallet",
// 		},
// 		businessWallet: {
// 			type: Schema.Types.ObjectId,
// 			ref: "businessWallet",
// 		},
// 		lockedFunds: [
// 			{
// 				type: Schema.Types.ObjectId,
// 				ref: "lockedFunds",
// 			},
// 		],
// 		savingTargets: [
// 			{
// 				type: Schema.Types.ObjectId,
// 				ref: "savingTargets",
// 			},
// 		],
// 		shop: {
// 			type: Schema.Types.ObjectId,
// 			ref: "shop",
// 		},
// 		wishlists: [
// 			{
// 				type: Schema.Types.ObjectId,
// 				ref: "wishlist",
// 			},
// 		],
// 		profileCompletion: { type: String, default: "0%" },
// 		userAllowedDevices: [userAllowedDevicesSchema],
// 		userSessions: [userSessionsSchema],
// 		verificationCodes: [verificationCodesSchema],
// 		interests: {
// 			type: [String],
// 		},
// 		adminAction: {
// 			date: {
// 				type: Date,
// 				default: Date.now,
// 			},
// 			reason: String,
// 			status: {
// 				type: String,
// 				enum: ["suspend", "reactivate"],
// 			},
// 			adminUser: {
// 				type: Schema.Types.ObjectId,
// 				ref: "adminuser",
// 			},
// 		},
// 		shop_followed: [
// 			{ type: Schema.Types.ObjectId, ref: "shop" },
// 		],
// 		user_deals: [
// 			{ type: Schema.Types.ObjectId, ref: "deal" },
// 		],
// 		budgets: [
// 			{ type: Schema.Types.ObjectId, ref: "budget" },
// 		],
// 		cart: [
// 			{ type: Schema.Types.ObjectId, ref: "cartitem" },
// 		],
// 		user_orders: [
// 			{ type: Schema.Types.ObjectId, ref: "order" },
// 		],
// 		disputes: [
// 			{ type: Schema.Types.ObjectId, ref: "dispute" },
// 		],
// 		shopMembership: [
// 			{
// 				type: Schema.Types.ObjectId,
// 				ref: "shopmember",
// 			},
// 		],
// 	},
// 	{
// 		timestamps: true,
// 	}
// );

// export const User = mongoose.model("user", UserSchema);

// // [
// // 	{
// // 		month: "Jan",
// // 		count: 23
// // 	},
// // 	{
// // 		month: "Jan",
// // 		count: 23
// // 	},
// // 	{
// // 		month: "Jan",
// // 		count: 23
// // 	},
// // 	{
// // 		month: "Jan",
// // 		count: 23
// // 	},
// // 	{
// // 		month: "Jan",
// // 		count: 23
// // 	},
// // ]
