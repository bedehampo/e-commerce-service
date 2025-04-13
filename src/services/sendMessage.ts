import twilio from "twilio";
import config from "../config";
import axios from 'axios';

// Your AccountSID and Auth Token from console.twilio.com
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export const sendMessageWithTermii = async (toPhone: string, msg: string) => {
  const data = {
    to: toPhone,
    from: "Motopay Termii",
    sms: msg,
    type: "plain",
    api_key: config.termii.termiiApiKey,
    channel: "generic",
  };

  try {
    const response = await axios.post("https://api.ng.termii.com/api/sms/send", data, {
      headers: {
        ContentType: 'application/json'
      }
    });
    console.log(response.data);
  } catch (err) {
    console.error(err);
  }
};


export const sendMessage = async (toPhone: string, msg: string) => {
    client.messages
      .create({
        body: msg,
        from: "Motopayx",
        to: toPhone,
      })
      .then((message: any) => {
        console.log(message.sid);
      })
      .catch((err: any) => {
        console.error(err);
    });
}