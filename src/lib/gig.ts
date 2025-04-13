import axios from "axios";
import config from "../config";
import {
  CalculateGigShipmentPriceInput,
  GigCaptureDeliveryResponse,
  RequestGigDeliveryInput,
} from "../types/order";

class GigService {
  client: any;

  constructor() {
    this.client = axios.create({
      baseURL: config.gig.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  async login(): Promise<{ UserId: string; access_token: string }> {
    try {
      const response = await this.client.post("/login", {
        username: config.gig.username,
        password: config.gig.password,
      });
      let data = response.data;
      return data.Object;
    } catch (error) {
      throw new Error(error);
    }
  }

  async calculateShipmentPrice(payload: CalculateGigShipmentPriceInput) {
    try {
      console.log("payload", payload);

      const response = await this.client.post("/price", payload);
      let data = response.data;
      console.log("gig data", data);
      return data.Object.GrandTotal;
    } catch (error) {
      throw new Error(error);
    }
  }

  async requestDelivery(
    payload: RequestGigDeliveryInput
  ): Promise<GigCaptureDeliveryResponse> {
    try {
      const response = await this.client.post("/captureshipment", payload);
      let data = response.data;
      return data.Object;
    } catch (error) {
      throw new Error(error);
    }
  }
}

export default new GigService();
