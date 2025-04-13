import { Order } from "../../model/shop/order";
import { OrderPaymentGroup } from "../../model/shop/OrderPaymentGroup";
import { Product } from "../../model/shop/product";
import { OrderStatus } from "../../types/order";
import { GetOrdersByUserInput } from "../../validation/order.schema";

const getUserOrdersService = async (
  userId,
  query: GetOrdersByUserInput["query"]
) => {
  const { status } = query;
  const payload: {
    user?: string;
    status?: any;
  } = {
    user: userId,
  };

  const statusMapping = {
    all: "all",
    ongoing: OrderStatus.PENDING,
    delivered: OrderStatus.DELIVERED,
  };
  console.log(payload);

  if (status !== "all") {
    payload.status = statusMapping[status];
  }

  const orderPaymentGroups = await OrderPaymentGroup.find({ user: userId });

  const result = await OrderPaymentGroup.aggregate([
    {
      $lookup: {
        from: "orders",
        localField: "orders",
        foreignField: "_id",
        as: "orders",
      },
    },
    {
      $unwind: {
        path: "$orders",
      },
    },
    // Populate cart items in the orders
    {
      $lookup: {
        from: "cart_items",
        localField: "orders.cartItem",
        foreignField: "_id",
        as: "cartItems",
      },
    },
    {
      $unwind: {
        path: "$cartItems",
      },
    },
    // Populate products in the cart items
    {
      $lookup: {
        from: "products",
        localField: "cartItems.product",
        foreignField: "_id",
        as: "cartItems.product",
      },
    },
    {
      $unwind: {
        path: "$cartItems.product",
      },
    },
    {
      $group: {
        _id: "$_id",
        user: { $first: "$user" },
        orders: { $push: "$orders" },
        totalAmount: { $first: "$totalAmount" },
        totalDiscount: { $first: "$totalDiscount" },
        subTotal: { $first: "$subTotal" },
        cartItems: { $push: "$cartItems" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $project: {
        user: 1,
        status: {
          $cond: {
            if: {
              $and: [
                { $gt: [{ $size: "$orders" }, 0] },
                {
                  $eq: [
                    {
                      $size: {
                        $filter: {
                          input: "$orders",
                          cond: { $eq: ["$$this.status", "delivered"] },
                        },
                      },
                    },
                    { $size: "$orders" },
                  ],
                },
              ],
            },
            then: "delivered",
            else: "pending",
          },
        },
        //total Paid is the gotten from the totalAmount field minus the totalDiscount field of the orderPaymentGroup
        totalPaid: {
          $subtract: ["$subTotal", "$totalDiscount"],
        },
        subTotal: 1,
        totalDiscount: 1,
        products: "$cartItems.product",
        orders: "$orders._id",
        createdAt: 1,
      },
    },
    {
      $match: {
        $and: [
          {
            user: userId,
          },
          payload,
        ],
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return result;
};

export default getUserOrdersService;
