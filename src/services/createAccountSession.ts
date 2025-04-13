// import { random } from "lodash";
// import config from "../config";
// // import { User } from "../model/User";
// import { generateJWTToken } from "../utils/global";
// import {
//   FlagTypes,
//   User as UserInterface,
//   UserSession,
// } from "../utils/interfaces";
// import moment from "moment";
// import { sendMessage } from "./sendMessage";

// const createAccountSession = async (
//   device_id: string,
//   user: any,
//   userAgent: string
// ) => {
//   let unknownDevice = false;
//   let token;
//   let userSession: UserSession = {};

//   userSession.deviceId = device_id;
//   userSession.userAgent = userAgent;

//   // check if device_id is in user's model
//   const device_idExists = await User.findOne({
//     _id: user._id,
//     "userAllowedDevices.deviceId": device_id,
//   });

//   if (!device_idExists) {
//     unknownDevice = true;
//     token = await generateJWTToken({
//       id: user._id,
//       flag: FlagTypes.TWO_FACTOR_AUTH,
//     });

//     const code = config.env.isProduction ? random(10000, 99999) : 1234;

//     const userVerificationCodesPayload = {
//       code: code,
//       code_expires_at: moment().add(30, "minutes") as any,
//     };

//     console.log(userVerificationCodesPayload);

//     // if (config.env.isProduction) {
//     //   await sendMessage(user.phoneNumber.number, code.toString());
//     // }

//     userSession.flag = FlagTypes.TWO_FACTOR_AUTH;
//     userSession.token = token as string;

//     const updateUser = await User.findOneAndUpdate(
//       { _id: user._id },
//       {
//         $push: {
//           userSessions: userSession,
//           verificationCodes: userVerificationCodesPayload,
//         },
//       },
//       { new: true }
//     );
//   } else {
//     token = await generateJWTToken({
//       id: user._id,
//       flag: FlagTypes.LOGIN,
//       phoneNumber: user.phoneNumber.number,
//     });

//     userSession.flag = FlagTypes.LOGIN;
//     userSession.token = token as string;

//     const updateUser = await User.findOneAndUpdate(
//       { _id: user._id },
//       {
//         $push: {
//           userSessions: userSession,
//         },
//       },
//       { new: true }
//     );
//   }

//   return {
//     userSession,
//     unknownDevice,
//     token: token,
//   };
// };

// export default createAccountSession;
