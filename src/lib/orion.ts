import axios from "axios";
import config from "../config";
import {

} from "../utils/interfaces";
import { OrionInitiateDeliveryPayload, OrionInitiateDeliveryResponse } from "../types/order";

class OrionDeliveryService {
  client: any;

  constructor() {
    this.client = axios.create({
      baseURL: config.orion.baseUrl,
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${config.orion.secretKey}`,
      },
    });
  }

  async createDelivery(
    payload: OrionInitiateDeliveryPayload
  ): Promise<OrionInitiateDeliveryResponse> {
    try {
      const response = await this.client.post("/", payload);
      let { data } = response.data;
      return data;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async calculateDeliveryCost(payload: {
    origin: {
      latitude: number;
      longitude: number;
    };
    destination: {
      latitude: number;
      longitude: number;
    };
  }) {
    try {
      const response = await this.client.post("/calculate", payload);
      let { data } = response.data;
      console.log(response.data);

      console.log(data);

      return data;
    } catch (error: any) {
      throw new Error(error);
    }
  }
}

export default new OrionDeliveryService();
