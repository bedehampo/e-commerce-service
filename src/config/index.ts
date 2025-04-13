const joi = require("joi");
require("dotenv").config();

const envVarsSchema = joi
  .object({
    NODE_ENV: joi.string().default("development"),
    MONGO_URI: joi.string().required().description("MongoDB URI is required"),
    TWILIO_ACCOUNT_SID: joi
      .string()
      .required()
      .description("Twilio account SID is required"),
    TWILIO_AUTH_TOKEN: joi
      .string()
      .required()
      .description("Twilio auth token is required"),
    JWT_SECRET: joi
      .string()
      .required()
      .description("JWT secret key is required"),
    USER_SERVICE_BASE_URL: joi
      .string()
      .required()
      .description(
        "The user service base url is required, key: USER_SERVICE_BASE_URL"
      ),
    TRANSACTION_SERVICE_BASE_URL: joi
      .string()
      .required()
      .description(
        "The transaction service base url is required, key: TRANSACTION_SERVICE_BASE_URL"
      ),
  })
  .unknown()
  .required();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: {
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
    isTest: process.env.NODE_ENV === "test",
  },
  gig: {
    baseUrl: envVars.GIG_TEST_BASE_URL,
    username: envVars.GIG_USERNAME,
    password: envVars.GIG_PASSWORD,
  },
  kwik: {
    baseUrl: envVars.KWIK_BASE_URL,
    email: envVars.KWIK_EMAIL,
    password: envVars.KWIK_PASSWORD,
    api_login: envVars.KWIK_API_LOGIN,
    domain: envVars.KWIK_DOMAIN_NAME,
  },
  mongo: {
    host: envVars.MONGO_URI,
  },
  twilio: {
    accountSid: envVars.TWILIO_ACCOUNT_SID,
    authToken: envVars.TWILIO_AUTH_TOKEN,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
  },
  okra: {
    publicKey: envVars.OKRA_PUBLIC_API_KEY,
    secretKey: envVars.OKRA_SECRET_KEY,
    clientToken: envVars.OKRA_CLIENT_TOKEN,
    baseUrl: envVars.OKRA_BASE_URL,
    livePublicKey: envVars.OKRA_LIVE_PUBLIC_API_KEY,
    liveSecretKey: envVars.OKRA_LIVE_SECRET_KEY,
    liveBaseUrl: envVars.OKRA_LIVE_BASE_URL,
    callBackUrl: envVars.OKRA_CALLBACK_URL,
  },
  budPay: {
    testSecretKey: envVars.BUDPAY_TEST_SECRET_KEY,
    testPublicKey: envVars.BUDPAY_TEST_PUBLIC_KEY,
    baseUrl: envVars.BUDPAY_BASE_URL,
  },
  termii: {
    termiiApiKey: envVars.TERMII_API_KEY,
    termiiSecretKey: envVars.TERMII_SECRET_KEY,
  },
  algolia: {
    appId: envVars.ALGOLIA_APPLICATION_ID,
    apiKey: envVars.ALGOLIA_API_KEY,
  },
  uiAvatars: {
    baseUrl: envVars.UI_AVATARS_BASE_URL,
  },
  aws: {
    accessKey: envVars.AWS_ACCESS_KEY_ID,
    secretKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION,
  },
  athena: {
    baseUrl: envVars.ATHENA_BASE_URL,
    secretKey: envVars.ATHENA_SECRET_KEY,
  },
  orion: {
    baseUrl: envVars.ORION_SERVICE_BASE_URL,
    secretKey: envVars.ORION_SECRET_KEY,
  },
  userService: {
    baseUrl: envVars.USER_SERVICE_BASE_URL,
  },
  adminService: {
    baseUrl: envVars.ADMIN_SERVICE_BASE_URL,
  },
  transactionService: {
    baseUrl: envVars.TRANSACTION_SERVICE_BASE_URL,
  },
  chatBotService: {
    baseUrl: envVars.MOTOPAY_CHATBOT_URL,
  },
  azure: {
    storage_connection_string: envVars.AZURE_STORAGE_CONNECTION_STRING,
    storage_account_name: envVars.AZURE_STORAGE_ACCOUNT_NAME,
    storage_account_key: envVars.AZURE_STORAGE_ACCOUNT_KEY,
    storage_container_name: envVars.AZURE_STORAGE_CONTAINER_NAME,
  },
  crc: {
    base_url: envVars.CRC_BASE_URL,
    username: envVars.CRC_USERNAME,
    password: envVars.CRC_PASSWORD,
  },
  periculum: {
    client_id: envVars.PERICULUM_CLIENT_ID,
    baseUrl: envVars.PERICULUM_BASE_URL,
  },
  dellyman: {
    apiSecret: envVars.DELLYMAN_API_SECRET,
    devBaseUrl: envVars.DELLYMAN_DEV_BASE_URL,
    liveBaseUrl: envVars.DELLYMAN_LIVE_BASE_URL,
  },
  recova: {
    baseUrl: envVars.RECOVA_BASE_URL,
    accessToken: envVars.RECOVA_ACCESS_TOKEN,
  },
  notificationService: {
    baseUrl: envVars.NOTIFICATION_URL,
  },
};

export default config;
