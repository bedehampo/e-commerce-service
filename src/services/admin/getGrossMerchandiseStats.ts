import { Order } from "../../model/shop/order";
import { OrderStatus } from "../../types/order";

export const getGrossMerchandiseStats = async () => {
  const totalComnpletedOrder = await Order.countDocuments({
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

  let totalGrossMerchandiseValue;

  if (totalGrossMerchandiseValueQuery.length > 0) {
    totalGrossMerchandiseValue = totalGrossMerchandiseValueQuery[0].total;
  } else {
    totalGrossMerchandiseValue = 0;
  }

  const dailyStats = await Order.aggregate([
    {
      $group: {
        _id: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by day
          returningCustomer: "$returningCustomer", // Group by returningCustomer field
          status: "$status", // Group by status field
          price: "$price", // Group by price field
        },
        count: { $sum: 1 }, // Count the number of orders
      },
    },
    {
      $group: {
        _id: "$_id.day",
        returningCustomers: {
          $sum: {
            $cond: [{ $eq: ["$_id.returningCustomer", true] }, "$count", 0], // Sum returning customers
          },
        },
        newCustomers: {
          $sum: {
            $cond: [{ $eq: ["$_id.returningCustomer", false] }, "$count", 0], // Sum new customers
          },
        },
        totalOrders: { $sum: "$count" }, // Total orders per day
        totalProductsSold: {
          $sum: { $cond: [{ $eq: ["$_id.status", "delivered"] }, "$count", 0] },
        },
        grossMerchandiseValue: {
          $sum: {
            $cond: [{ $eq: ["$_id.status", "delivered"] }, "$_id.price", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0, // Exclude _id field
        day: "$_id",
        returningCustomers: 1,
        newCustomers: 1,
        totalOrders: 1,
        totalProductsSold: 1,
        grossMerchandiseValue: 1,
        totalDeliveredOrders: 1,
        averageOrderValue: {
          $cond: [
            { $eq: ["$totalProductsSold", 0] }, // Check if totalProductsSold is 0 to avoid division by zero
            0, // If totalProductsSold is 0, set averageOrderValue to 0
            { $divide: ["$grossMerchandiseValue", "$totalProductsSold"] }, // Calculate averageOrderValue
          ],
        },
      },
    },
    {
      $sort: { day: 1 }, // Optionally sort by day
    },
  ]);
  return {
    totalComnpletedOrder,
    totalGrossMerchandiseValue,
    dailyStats,
  };
};

export default getGrossMerchandiseStats;
