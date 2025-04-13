import { NextFunction, Response } from "express";
import { CustomRequest } from "../../utils/interfaces";
import { successResponse } from "../../helpers";
import { Order } from "../../model/shop/order";
import { Product } from "../../model/shop/product";
import mongoose from "mongoose";
import { Shop } from "../../model/shop/shop";
import { BusinessWallet } from "../../model/budgetWallets/BusinessWallets";
import { NotFoundError } from "../../errors";
import { Transactions } from "../../model/Transactions";
import { CartItem } from "../../model/shop/cartItem";
import {
  DellymanOrderStatus,
  DellymanWebhookResponse,
  KwikWebhookResponse,
  OrderDeliveryStatus,
  OrderPaymentStatus,
} from "../../types/order";
import { OrderGroup } from "../../model/shop/OrderGroup";

export const confirmDelivery = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const { orderId } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const order = await Order.findById(orderId);
    const user = order.user;
    //disburse to shop wallets
    const shopUsers = [];

    //update popularity score and views of the product

    const cartItemId = order.cartItem;

    const cartItem = await CartItem.findById(cartItemId);

    const productId = cartItem.product;

    await Product.findByIdAndUpdate(productId, {
      $inc: { popularityScore: 1 },
      $push: { views: new mongoose.Types.ObjectId(user) },
    });

    const shop = await Shop.findById(order.shop);
    console.log(shop.user);

    shopUsers.push(shop.user);
    console.log(shopUsers);

    const shopBusinessWallet = await BusinessWallet.findOne({
      user: new mongoose.Types.ObjectId(shop?.user),
    });

    if (!shopBusinessWallet) {
      throw new NotFoundError("Shop wallet not found");
    }

    shopBusinessWallet.balance += order.price;
    await shopBusinessWallet.save({ session });

    order.paymentStatus = OrderPaymentStatus.PAID;
    await order.save({ session });

    //save transaction of the shop owner
    const shopTransaction = await new Transactions({
      user: shop?.user,
      amount: order.price,
      transactionType: "credit",
      status: "successful",
      currency: "NGN",
      sourceWallet: "mainWallet",
      destinationWallet: "businessWallet",
      transferChannel: "Moto Transfer",
      txnDescription: `Payment for order ${orderId}`,
    });

    await shopTransaction.save({ session });

    //send notification to shop owner

    //send notification to user

    await session.commitTransaction();
    session.endSession();
    return res.send(successResponse("", null));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const kwikConfirmDelivery = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const { unique_order_id, pickup_job_status, delivery_job_status, task_id } =
    req.body as KwikWebhookResponse;
  console.log(req.body);

  try {
    const orderGroup = await OrderGroup.findOne({
      shipmentId: unique_order_id,
    });

    if (!orderGroup) {
      throw new NotFoundError("Order not found");
    }

    //update orderGroup status
    orderGroup.deliveryStatus = OrderDeliveryStatus.DELIVERED;
    await orderGroup.save();

    //update order status
    const orders = orderGroup.orders;
    for (let order of orders) {
      await Order.findByIdAndUpdate(order, {
        deliveryStatus: OrderDeliveryStatus.DELIVERED,
      });
    }

    //send notification to user

    //send notification to shop owner
  } catch (error) {
    next(error);
  }
};

export const dellyManWebhookHandler = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as DellymanWebhookResponse;
    const {
      TrackingID,
      OrderCode,
      AssignedAt,
      OrderID,
      OrderDate,
      OrderStatus,
      OrderPrice,
      CustomerID,
      PickedUpAt,
      DeliveredAt,
      CompanyID,
    } = data.order;

    //console.log("dellyman webhook response received", req.body);

    const orderGroup = await OrderGroup.findOne({
      dellymanDetails: { TrackingID },
    });

    if (orderGroup) {
      orderGroup.dellymanDetails = {
        TrackingID,
        OrderCode,
        AssignedAt,
        OrderID,
        OrderDate,
        OrderStatus,
        OrderPrice,
        CustomerID,
        PickedUpAt,
        DeliveredAt,
        CompanyID,
      };
      const orders = orderGroup.orders;
      if (OrderStatus === DellymanOrderStatus.COMPLETED) {
        orderGroup.deliveryStatus = OrderDeliveryStatus.DELIVERED;
        orderGroup.deliveryDate = new Date();

        await orderGroup.save();
        //update orders

        for (let order of orders) {
          await Order.findByIdAndUpdate(order, {
            deliveryStatus: OrderDeliveryStatus.DELIVERED,
            deliveryDate: new Date(),
            dellymanDetails: {
              TrackingID,
              OrderCode,
              AssignedAt,
              OrderID,
              OrderDate,
              OrderStatus,
              OrderPrice,
              CustomerID,
              PickedUpAt,
              DeliveredAt,
              CompanyID,
            },
          });
        }
      } else {
        await orderGroup.save();
        for (let order of orders) {
          await Order.findByIdAndUpdate(order, {
            dellymanDetails: {
              TrackingID,
              OrderCode,
              AssignedAt,
              OrderID,
              OrderDate,
              OrderStatus,
              OrderPrice,
              CustomerID,
              PickedUpAt,
              DeliveredAt,
              CompanyID,
            },
          });
        }
      }
    }

    return res.send(
      successResponse("dellyman webhook response received", req.body)
    );
  } catch (error) {
    next(error);
  }
};
