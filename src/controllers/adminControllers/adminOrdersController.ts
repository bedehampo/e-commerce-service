import { NextFunction, Response } from "express";
import { CustomRequest } from "../../utils/interfaces";
import { CartItem } from "../../model/shop/cartItem";
import { updateOrderInput } from "../../validation/order.schema";
import { Order } from "../../model/shop/order";
import { successResponse } from "../../helpers";

// export const clearCartForAllUsers = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     await CartItem.deleteMany({
//       //
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const updateOrder = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const { orderId } = req.params;
    const { returningCustomer } = data as updateOrderInput["body"];
    await Order.updateMany({
      returningCustomer: true,
    });
    // if (!order) {
    //   throw new Error("Order not found");
    // }
    // order.returningCustomer = returningCustomer;
    // await order.save();

    return res.send(successResponse("Orders updated successfully", null));
  } catch (error) {
    next(error);
  }
};
