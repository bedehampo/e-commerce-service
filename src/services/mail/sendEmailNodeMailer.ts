import nodemailer from "nodemailer";
import { twoFactorAuthTemplate } from "./templates";

const sendMailNodeMailer = async (message, recipient, template) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      // host: process.env.MAIL_HOST,
      // port: process.env.MAIL_PORT,
      // secure: false,
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    const mailOptions = {
      from: "Motopay",
      to: recipient,
      subject: "Deal",
      text: message,
      html: template.replace("{{ message }}", message),
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      }
      resolve(info);
    });
  });
};

export default sendMailNodeMailer;
