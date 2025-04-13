import { Request } from "express";
import { Session, SessionData } from "express-session";
import mongoose, {
	Query,
	Document,
	Schema,
} from "mongoose";
import { UserService } from "../lib/userService";
import { AdminService } from "../lib/adminService";
import { AdminUser } from "../types/user";
import { TransactionService } from "../lib/transactionService";

export interface TokenPayload {
	user: {
		id: number;
		// phoneNumber?: string;
	};
}

declare module "express-session" {
	interface SessionData {
		newPin?: string;
	}
}

export interface CustomRequest extends Request {
	user?: TokenPayload["user"];
	userService: UserService;
	transactionService: TransactionService;
	session: Session & Partial<SessionData>;
	userAgent?: string;
	shop?: {
		_id: string;
		user: string;
	};
	isShopOwner?: boolean;
	shopMember?: {
		permissions: { permissionCode: string }[];
	};
	adminUser?: {
		_id: string;
		email: string;
	};
}

export interface AdminNewRequest extends Request {
	user?: {
		sub: string;
		name?: string;
		email?: string;
		role?: string;
		permissions?: string[];
		SourceId?: string;
		aud?: string;
		client_id?: string;
		oi_prst?: string;
		oi_tkn_id?: string;
	};
}

export interface AdminRequest extends Request {
  adminUser?: AdminUser;
  AdminService: AdminService;
  userService: UserService;
  transactionService: TransactionService;
}
export interface CustomRequest extends Request {
  user?: TokenPayload["user"];
  session: Session & Partial<SessionData>;
  userAgent?: string;
  shop?: {
    _id: string;
    user: string;
  };
  isShopOwner?: boolean;
  shopMember?: {
    permissions: { permissionCode: string }[];
  };
  adminUser?: {
    _id: string;
    email: string;
  };
}

export interface ITerm {
	heading: string;
	body: string;
	status?: string;
}

export interface RequestWithUserAgent extends Request {
	userAgent: string;
}

export interface IPhoneNumber extends Document {
	country: string;
	countryCallingCode: string;
	nationalNumber: string;
	number: string;
	phone: string;
}

export interface OkraCreateCustomerResult {
	accounts: {
		name: string;
		nuban: string;
		currency: string;
	};
	auth: {
		bank_details: {
			name: string;
			_id: string;
			slug: string;
		};
		bank_id: string;
		customer_id: string;
		clientId: string;
	};
}

export interface User {
	_id?: Schema.Types.ObjectId;
	userAllowedDevices?: UserAllowedDevice[];
	userSessions: UserSession[];
}

export interface UserAllowedDevice {
	deviceId: string;
	userAgent: string;
	initiatedAt: Date;
	lastAccessedAt: Date;
}

export interface UserSession {
	deviceId?: string;
	userAgent?: string;
	flag?: FlagTypes;
	token?: string;
}

export enum FlagTypes {
	LOGIN = "LOGIN",
	TWO_FACTOR_AUTH = "2FA",
}

export interface PostSchema {
	photos: [];
	exactLocation: string | any;
	description: string;
	taggedUsers: [];
	location: {} | undefined;
	allowComment: boolean;
	allowRepost: boolean;
	altText: string;
	user: {};
	repostedFrom: {} | undefined;
	isReposted: boolean;
	repostedBy: {};
	originalPoster: {};
	likes: [];
	likesCount: number;
	comments: [];
	commentCount: {};
	repostCount: number;
	createdAt: {};
	updatedAt: {};
}

export enum ReportType {
	Post = "post",
	Comment = "comment",
}

export interface ReportPostSchema {
	reportMessage: string;
	reportType: ReportType;
	postId?: {};
	commentId?: {};
	reporterId: {};
	userId: {};
	createdAt: Date;
	updatedAt: Date;
}

// export interface agoraChatInterface {
//   appKey: string | undefined,
//   appCertificate: string | any,
// }

export enum StatusTypes {
	ACTIVE = "active",
	DECLINED = "declined",
	SUSPENDED = "suspended",
	DELETED = "deleted",
	INACTIVE = "inactive",
}

export enum LoanStatusTypes {
	PENDING = "pending",
	APPROVED = "approved",
	REJECTED = "rejected",
	COMPLETED = "completed",
	DISBURSED = "disbursed",
	DEFAULTED = "defaulted",
}

export interface IIdempotencyKey extends Document {
	key: string;
	transactionId: string;
	createdAt: Date;
}

export interface IHereOption {
	provider: string | any;
	appId?: string;
	apiKey: string | undefined;
	appCode?: string;
	language?: string | undefined;
	politicalView?: string | undefined;
	country?: string | undefined;
	state?: string | undefined;
	production?: boolean | undefined;
	httpAdapter?: string;
	formatter: null | any;
}

export interface ISearchResult {
	name: string;
	description: string;
	category: string;
}

export interface IFilterCriteria {
	minPrice?: number;
	maxPrice?: number;
	category?: string;
}

export interface ISuggestionResult {
	suggestion: string;
}

export interface IProduct extends Document {
	shop: mongoose.Types.ObjectId;
	productImage?: string[];
	productName: string;
	productDescription: string;
	productPrice: number;
	productCategory: mongoose.Types.ObjectId;
	shop_list: mongoose.Types.ObjectId;
	negotiable: boolean;
	bulkPrice?: number;
	discountAmount: number;
	bulkQuantity: number;
	productQuantity: number;
	hashtags: mongoose.Types.ObjectId[];
	discount: number;
	isDiscount: boolean;
	status: "active" | "out-of-stock" | "deleted";
	upvotes: mongoose.Types.ObjectId[];
	downvotes: mongoose.Types.ObjectId[];
	upvoteCount: number;
	downvoteCount: number;
	customFields: { title: string; value: string }[];
}
export interface StorySchema {
	photo: {};
	user: {};
	createdAt: {};
	expiresAt: {};
	viewCount: {} | any;
	viewers: [];
}

export enum BusinessWalletType {
	customer = "customer",
	merchant = "merchant",
}

export enum ImageUploadType {
	MULTERFILE = "multerfile",
	BASE64 = "base64",
}
