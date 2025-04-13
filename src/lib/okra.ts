import axios from "axios";
import config from "../config";

class okraService {
  client: any;

  constructor() {
    this.client = axios.create({
      baseURL: config.env.isDevelopment
        ? config.okra.baseUrl
        : config.env.isProduction
        ? config.okra.liveBaseUrl
        : config.okra.baseUrl,
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${
          config.env.isDevelopment
            ? config.okra.secretKey
            : config.env.isProduction
            ? config.okra.liveSecretKey
            : config.okra.baseUrl
        }`,
      },
    });
  }

  async processSpendingPattern(customerId: string) {
    try {
      const payload = {
        customer_id: customerId,
      };
      console.log(payload);

      const response = await this.client.post(
        "/spending-patterns/process",
        payload
      );
      let { data } = response.data;
      return data;
    } catch (error: any) {
      console.log(error);

      throw new Error(error);
    }
  }

  async getSpendingPattern(customerId: string) {
    try {
      const response = await this.client.get(
        `/spending-patterns/${customerId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async processCustomerIncome(customerId: string) {
    try {
      const response = await this.client.post("/income/process", {
        customer_id: customerId,
      });
      let { data } = response.data;
      return data;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getCustomerIncome(customerId: string) {
    try {
      const response = await this.client.get(`/income/${customerId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async verifyBvn(bvn: string) {
    try {
      const response = await this.client.post(`/products/kyc/bvn-verify`, {
        bvn,
      });
      let { data } = response.data;
      return data;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async generateWidgetUrl(payload: any) {
    try {
      console.log(config.okra.secretKey);

      const response = await this.client.post("links/new", payload);
      let { data } = response.data;
      return data;
    } catch (error: any) {
      throw new Error(error);
    }
  }
}

export default new okraService();
