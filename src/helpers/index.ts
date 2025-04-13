import crypto from "crypto";
const SECRET_HELP = "bedehampo";
export const random = () => crypto.randomBytes(128).toString("base64");
export const authentication = (salt: string, password: string) => {
  return crypto
    .createHmac("sha256", salt + password)
    .update(SECRET_HELP)
    .digest("hex");
};

export const successResponse = (message: string, data: any) => {
  return {
    status: "success",
    message,
    data,
  };
};
