import axios from "axios";
import config from "../config";
import {
  NotificationByEmailFinalPayload,
  NotificationByEmailPayload,
} from "../types/notification";
import { IUser } from "../types/user";

export class NotificationService {
  client: any;

  constructor() {
    this.client = axios.create({
      baseURL: config.notificationService.baseUrl,
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  async sendNotification(payload: NotificationByEmailPayload, user: IUser) {
    try {
      console.log("env", config.notificationService.baseUrl);

      const finalPayload: NotificationByEmailFinalPayload = {
        ...payload,
        recipientPhone: user.mobileNumber,
        recipientEmail: user.email,
        sendSms: user.enableSms,
        sendEmail: user.enableEmail,
        sendPush: user.enablePushNotifications,
      };

      console.log("finalPayload", finalPayload);

      const response = await this.client.post("", finalPayload);
      console.log("raw response", response);

      let data = response.data;
      console.log("data", data);

      return data;
    } catch (error) {
      return error.response.data;
    }
  }
}

export default new NotificationService();
