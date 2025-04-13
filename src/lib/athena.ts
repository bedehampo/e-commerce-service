import axios from "axios";
import config from "../config";

class AthenaDeliveryService {
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

  async createDelivery(payload: {
    shopOwnerAddress: {
      latitude: number;
      longitude: number;
    };
    receiversPhoneNumber: string;
    receiversName: string;
    orderId: string;
    deliveryAddress: {
      latitude: number;
      longitude: number;
    };
  }) {
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
      return data;
    } catch (error: any) {
      throw new Error(error);
    }
  }
}

export default new AthenaDeliveryService();
