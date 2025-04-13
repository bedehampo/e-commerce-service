import { NextFunction, Response } from "express";
import {
  AuthenticationError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "../errors";

import { CustomRequest } from "../utils/interfaces";
import bcrypt from "bcrypt";

// export const validatePin = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { pin } = req.body;
//     const userId = req.user && req.user.id;
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new NotFoundError("User not found");
//     }

//     // Check if user has set transfer pin
//     if (!user.pin) {
//       throw new ServiceError("You have not set a transfer pin");
//     }

//     // Check if pin is supplied
//     if (!pin) {
//       throw new ValidationError("Pin is required");
//     }

//     // decrypt and compare pin
//     // const matchPin = await bcrypt.compare(pin, user.pin);

//     if (pin !== user.pin) {
//       throw new AuthenticationError("Incorrect pin");
//     }

//     next();
//   } catch (err) {
//     console.error(err.message);
//     next(err);
//   }
// };
