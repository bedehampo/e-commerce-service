import mongoose from "mongoose";
import { Order } from "../../model/shop/order";
import { OrderStatus } from "../../types/order";

const getOrderAcceptanceRateStatsByASingleShopService = async (shopId) => {
  const result = await Order.aggregate([
    {
      $match: {
        shop: new mongoose.Types.ObjectId(shopId), // Match the input shopId
        // status: OrderStatus.ACCEPTED, // Only consider accepted orders
      },
    },
    {
      $addFields: {
        orderTurnOutRate: {
          $divide: [
            { $subtract: ["$acceptedAt", "$createdAt"] }, // Calculate the time difference in milliseconds
            1000, // Convert milliseconds to seconds
          ],
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by createdAt date
        totalOrders: { $sum: 1 }, // Count the total number of orders for each day
        totalValue: { $sum: "$price" }, // Calculate the total value of orders for each day
        totalTurnOutTime: { $sum: "$orderTurnOutRate" }, // Sum up the order turn-out times
        acceptedOrdersCount: { $sum: 1 }, // Count the total number of accepted orders for each day
      },
    },
    {
      $addFields: {
        orderAcceptanceRate: {
          $multiply: [
            { $divide: ["$acceptedOrdersCount", "$totalOrders"] }, // Calculate acceptance rate for each day
            100, // Convert to percentage
          ],
        },
        averageOrderTurnOutRate: {
          $divide: [
            "$totalTurnOutTime", // Total turn-out time for each day
            "$acceptedOrdersCount", // Total accepted orders for each day
          ],
        },
      },
    },
    {
      $project: {
        _id: 0, // Exclude the default _id field
        date: "$_id", // Rename _id to date
        totalOrders: 1,
        totalValue: 1,
        acceptedOrdersCount: 1,
        orderAcceptanceRate: 1,
        averageOrderTurnOutRate: 1,
      },
    },
    {
      $sort: { date: 1 }, // Sort the results by date
    },
  ]);
  return result;
};

export default getOrderAcceptanceRateStatsByASingleShopService;
