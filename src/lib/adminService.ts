import axios from "axios";
import config from "../config";
import { AdminUser } from "../types/user";

interface IUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  accountNumber: string;
  gender: string | null;
  tier: string | null;
  motopayTag: string;
  dob: string;
  active: boolean;
  locked: boolean;
  activated: boolean;
  bvnVerified: boolean;
  phoneVerified: boolean;
  status: string;
  email: string;
}

export class AdminService {
  client: any;

  constructor() {
    this.client = axios.create({
      baseURL: config.adminService.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  async getUser(): Promise<AdminUser> {
    try {
      const response = await this.client.get("/api/admin/user");
      let { data } = response.data;
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id: string): Promise<IUserResponse> {
    try {
      const response = await this.client.get(`/${id}`);
      let { data } = response.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
  async checkPermission(permissionName: string): Promise<boolean> {
    try {
      const response = await this.client.post("/api/admin/role/check", {
        name: permissionName,
      });
      let { data } = response.data;
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getRoleDetails(roleId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/admin/role/${roleId}`);
      let { data } = response.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export default new AdminService();
