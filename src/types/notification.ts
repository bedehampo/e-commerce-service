export interface NotificationByEmailFinalPayload {
  sender: string;
  recipientPhone: string;
  recipientEmail: string;
  subject: string;
  message: string;
  notificationSource: string;
  sendSms: boolean;
  sendEmail: boolean;
  sendPush: boolean;
}

export interface NotificationByEmailPayload {
  sender: string;
  subject: string;
  message: string;
  notificationSource: string;
}
