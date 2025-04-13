import axios from "axios";
import config from "../config";
import {
  DellymanBookOrderApiResponse,
  DellyManBookOrderPayload,
  DellyManGetQuoteApiResponse,
  DellymanGetQuotesPayload,
} from "../types/order";

class DellymanService {
  client: any;

  constructor() {
    this.client = axios.create({
      // baseURL: config.env.isProduction
      //   ? config.dellyman.liveBaseUrl
      //   : config.dellyman.devBaseUrl,
      baseURL: config.dellyman.devBaseUrl,
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${
          config.env.isProduction
            ? config.dellyman.apiSecret
            : config.dellyman.apiSecret
        }`,
      },
    });
  }

  async getStates() {
    try {
      const response = await this.client.get("/States");
      let data = response.data;
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getVehicles() {
    try {
      const response = await this.client.get("/Vehicles");
      let data = response.data;
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getQuotes(
    payload: DellymanGetQuotesPayload
  ): Promise<DellyManGetQuoteApiResponse> {
    try {
      const response = await this.client.post("/GetQuotes", payload);
      // console.log(config.dellyman.apiSecret);

      // console.log(response);
      let data = response.data;
      // console.log(data);

      return data;
    } catch (error) {
      return error;
    }
  }

  async bookOrder(
    payload: DellyManBookOrderPayload
  ): Promise<DellymanBookOrderApiResponse> {
    try {
      const response = await this.client.post("/BookOrder", payload);
      let data = response.data;
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }
  async trackOrder(payload: any) {
    try {
      const response = await this.client.post("/TrackOrder", payload);
      let data = response.data;
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  async fetchOrders(payload: any) {
    try {
      const response = await this.client.post("/FetchOrders", payload);
      let data = response.data;
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }
}

export default new DellymanService();
