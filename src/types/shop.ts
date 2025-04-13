import { Document, Types } from "mongoose";
import { StatusTypes } from "../utils/interfaces";

interface IUserVisit {
  count: number;
  time: Date;
}

interface IGeoJson {
  type: string;
  coordinates: number[];
}

export interface IShop extends Document {
  category: Types.ObjectId;
  user: Types.ObjectId;
  brand_name: string;
  official_email?: string;
  description: string;
  followers: Types.ObjectId[];
  official_phone_number?: string;
  tierLevel: "Tier 1" | "Tier 2" | "Tier 3";
  shop_listings: Types.ObjectId[];
  location: IGeoJson;
  address?: string;
  state?: Types.ObjectId;
  lga?: Types.ObjectId;
  products: Types.ObjectId[];
  shopLogoName: string | null;
  shopLogoUrl: string | null;
  status: StatusTypes;
  adminAction: {
    date: Date;
    reason?: string;
    status: "suspend" | "reactivate";
    adminUser: Types.ObjectId;
  };
  shop_disputes: Types.ObjectId[];
  shopMembers: Types.ObjectId[];
  shopVisitCount: {
    visitors: Types.ObjectId[];
    visits: IUserVisit[];
    newVisit: IUserVisit[];
  };
}

// enum: [
//   "unverified",
//   "verified",
//   "out-of-stock",
//   "deleted",
// ],

export enum ProductStatus {
  UNVERIFIED = "unverified",
  VERIFIED = "verified",
  DECLINED = "declined",
  OUT_OF_STOCK = "out-of-stock",
  DELETED = "deleted",
}
