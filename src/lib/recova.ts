import axios from "axios";
import config from "../config";
import {
  RecovaCreateConsentRequestPayload,
  RecovaCreateConsentRequestResponse,
} from "../types/loan";

class RecovaService {
  client: any;

  constructor() {
    this.client = axios.create({
      baseURL: config.recova.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.recova.accessToken}`,
      },
    });
  }

  async createConsentRequest(
    payload: RecovaCreateConsentRequestPayload
  ): Promise<RecovaCreateConsentRequestResponse> {
    try {
      const response = await this.client.post(
        "/recova_ofi_handshake/api/ConsentRequest/CreateConsentRequest",
        payload
      );
      let data = response.data;
      return data;
    } catch (error) {
      return error.response.data;
    }
  }
}

export default new RecovaService();
