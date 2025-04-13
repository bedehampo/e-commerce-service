import axios from "axios";
import config from "../config";
import { UserServiceResponse } from "../types/user";

export interface IUserResponse {
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
	createdOn:number;
}

export class UserService {
  client: any;

  constructor() {
    this.client = axios.create({
      baseURL: config.userService.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // async login(payload: { username: string; password: string }): Promise<{
  //   accessToken: string;
  //   id: number;
  //   username: string;
  //   firstName: string;
  //   lastName: string;
  // }> {
  //   try {
  //     const response = await this.client.post("/login", payload);
  //     let { data } = response.data;
  //     return data;
  //   } catch (error) {
  //     throw new Error(error);
  //   }
  // }

  async getUser(): Promise<IUserResponse> {
    try {
      const response = await this.client.get("/user-profile");
      // console.log(response);
      let { data } = response.data;
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id: number): Promise<IUserResponse> {
    try {
      const response = await this.client.get(`/${id}`);
      let { data } = response.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getAllUsers(): Promise<IUserResponse[]> {
    try {
      const response = await this.client.get(`/get-all-users`);
      let { data } = response.data;
      return data;
    } catch (error) {
      throw error;
    }
  }

  async updateUsersShopStatus(
    status: ShopStatus
  ): Promise<UserServiceResponse<null>> {
    try {
      console.log("helrff");
      const response = await this.client.put(`/shop-status/${status}`);
      console.log(response);
      let data = response.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
}

enum ShopStatus {
  TRUE = 1,
  FALSE = 0,
}
export default new UserService();
