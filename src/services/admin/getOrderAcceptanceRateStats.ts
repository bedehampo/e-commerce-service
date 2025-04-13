import { Order } from "../../model/shop/order";
import { OrderStatus } from "../../types/order";

export const getOrderAcceptanceRateStatsService = async () => {
  const totalCompletedOrder = await Order.countDocuments({
    status: OrderStatus.DELIVERED,
  });

  const totalGrossMerchandiseValueQuery = await Order.aggregate([
    {
      $match: {
        status: OrderStatus.DELIVERED,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$price" },
      },
    },
  ]);

  let totalOrderValue;

  if (totalGrossMerchandiseValueQuery.length > 0) {
    totalOrderValue = totalGrossMerchandiseValueQuery[0].total;
  } else {
    totalOrderValue = 0;
  }

  // for each shop, get the total number of orders and the total value of orders

  const result = await Order.aggregate([
    // {
    //   $addFields: {
    //     orderTurnOutRate: {
    //       $divide: [
    //         { $subtract: ["$acceptedAt", "$createdAt"] }, // Calculate the time difference in milliseconds
    //         1000, // Convert milliseconds to seconds
    //       ],
    //     },
    //   },
    // },
    {
      $lookup: {
        from: "shops",
        localField: "shop",
        foreignField: "_id",
        as: "shop_info",
      },
    },
    {
      $unwind: "$shop_info",
    },
    {
      $group: {
        _id: "$shop_info._id",
        shopName: { $first: "$shop_info.brand_name" },
        totalOrders: { $sum: 1 }, // Count the total number of orders for each shop
        totalValue: { $sum: "$price" }, // Calculate the total value of orders
        totalTurnOutTime: { $sum: "$orderTurnOutRate" }, // Sum up the order turn-out times
      },
    },
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "shop",
        as: "shopOrders",
      },
    },
    {
      $addFields: {
        acceptedOrdersCount: { $size: "$shopOrders" }, // Count the total number of accepted orders for each shop
        orderAcceptanceRate: {
          $multiply: [
            {
              $divide: [
                { $size: "$shopOrders" }, // Total accepted orders
                "$totalOrders", // Total orders
              ],
            },
            100, // Convert to percentage
          ],
        },
        averageOrderTurnOutRate: {
          $divide: [
            "$totalTurnOutTime", // Total turn-out time
            { $size: "$shopOrders" }, // Total accepted orders
          ],
        },
      },
    },
    {
      $project: {
        shopOrders: 0,
        totalTurnOutTime: 0,
      },
    },
  ]);
  return {
    totalCompletedOrder,
    totalOrderValue,
    result,
  };
};

export default getOrderAcceptanceRateStatsService;
//65ba1d3588e6fd6e983ba3d0
//65b9ff91455b7529f227d102
//65b86c7e1939148405647a96
//65b86c65e466d3a754a3ca2f
