// import { NextFunction, Response } from "express";
// import { CustomRequest } from "../utils/interfaces";
// import { successResponse } from "../helpers";
// import { Notification } from "../model/shop/notifications";

// export const addNotification = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // Extract the notification data from the request body
//     const { title, description } = req.body;

//     // Create a new notification
//     const notification = new Notification({
//       title,
//       description,
//     });

//     // Save the notification
//     await notification.save();

//     // Return success response
//     return res.send(
//       successResponse("Notification created successfully", notification)
//     );
//   } catch (error) {
//     next(error);
//   }
// };
