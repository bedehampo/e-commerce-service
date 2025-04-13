import axios from "axios";
import config from "../config";
import {
  KwikCalculatePricePayload,
  KwikCalculatePriceResponse,
  KwikCreateTaskPayload,
  KwikCreateTaskSuccessResponse,
  KwikServiceResponse,
  KwikVendorloginResponse,
} from "../types/order";

class KwikDeliveryService {
  client: any;

  constructor() {
    this.client = axios.create({
      baseURL: config.kwik.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async login(): Promise<KwikVendorloginResponse> {
    try {
      let payload = {
        email: config.kwik.email,
        password: config.kwik.password,
        api_login: config.kwik.api_login,
        domain_name: config.kwik.domain,
      };
      const response = await this.client.post("/vendor_login", payload);
      let data = response.data;
      return data.data;
    } catch (error) {
      throw new Error(error);
    }
  }

  async calculateShipmentPrice(
    payload: KwikCalculatePricePayload
  ): Promise<KwikServiceResponse<KwikCalculatePriceResponse>> {
    try {
      // console.log("payload", payload);

      const response = await this.client.post(
        "/send_payment_for_task",
        payload
      );
      let data = response.data;
      // console.log(data);

      return data;
    } catch (error) {
      throw new Error(error);
    }
  }
  async getVehicle(payload: { access_token: string }) {
    try {
      const { access_token } = payload;
      const response = await this.client.get(
        `/getVehicle?access_token=${access_token}&is_vendor=1`
      );
      let data = response.data;
      return data.Object;
    } catch (error) {
      throw new Error(error);
    }
  }
  async requestDelivery(
    payload: KwikCreateTaskPayload
  ): Promise<KwikCreateTaskSuccessResponse> {
    try {
      const response = await this.client.post(
        "/create_task_via_vendor",
        payload
      );
      let data = response.data;
      console.log(data);
      return data.data;
    } catch (error) {
      throw new Error(error);
    }
  }

  async fetchJobStatus(payload: {
    access_token: string;
    job_id: string;
    unique_order_id: string;
  }): Promise<KwikServiceResponse<any>> {
    try {
      const { access_token, job_id } = payload;
      const response = await this.client.get(
        `/get_task_status?access_token=${access_token}&job_id=${job_id}`
      );
      let data = response.data;
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }
}

export default new KwikDeliveryService();
