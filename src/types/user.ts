import { Document } from "mongoose";
import { IPhoneNumber } from "../utils/interfaces";
import { ICartItem } from "./order";

// export interface IUser extends Document {
//   firstName: string;
//   lastName: string;
//   phoneNumber: IPhoneNumber;
//   cart: ICartItem[];
// }

export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  accountNumber: string;
  gender: string;
  tier: number;
  ninVerified: boolean;
  addressVerificationInitiated: boolean;
  addressVerificationResultReceived: boolean;
  addressVerified: boolean;
  facialVerified: boolean;
  proofOfAddressUploaded: boolean;
  motopayTag: string;
  profilePhotoUrl: string;
  email: string;
  bvn: string;
  hasShop: boolean;
  hasBusiness: boolean;
  enableSms: boolean;
  enableEmail: boolean;
  enablePushNotifications: boolean;
  referralCode: string;
  referredBy: null | string;
  dob: string;
  active: boolean;
  locked: boolean;
  bvnVerified: boolean;
  phoneVerified: boolean;
  activated: boolean;
  pinSet: boolean;
}

export interface AdminUser {
  _id: string;
  passport: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  email: string;
  emailVerified: boolean;
  password: string;
  pin: string | null; // Adjust if the pin can be a string
  status: AdminStatus;
  otp: {
    otp: string;
  };
  adminRole: string | null; // Adjust if the adminRole can have a specific type
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// "unverified", "verified", "suspended", "resigned", "sacked", null
export enum AdminStatus {
  unverified = "unverified",
  VERIFIED = "verified",
  SUSPENDED = "suspended",
  RESIGNED = "resigned",
  SACKED = "sacked",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export interface UserServiceResponse<T> {
  status: UserServiceStatus;
  message: string;
  data?: T;
}

export enum UserServiceStatus {
  SUCCESSFUL = "success",
  ERROR = "error",
}
