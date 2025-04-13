import { Order } from "../../model/shop/order";
import { OrderStatus } from "../../types/order";

export const getOrderAcceptanceRateByYearService = async (year: number) => {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, 0, 1), // Start of the year
          $lt: new Date(year + 1, 0, 1), // Start of the next year
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" }, // Grouping by month
        totalOrders: {
          $sum: {
            $cond: [
              { $ne: ["$status", "pending"] }, // Check if status is not equal to "pending"
              1,
              0,
            ],
          },
        }, // Count total orders for each month
        acceptedOrders: {
          $sum: {
            $cond: [
              { $in: ["$status", ["accepted", "delivered"]] }, // Check if status is either "accepted" or "delivered"
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $addFields: {
        monthName: {
          $switch: {
            branches: [
              { case: { $eq: ["$_id", 1] }, then: "January" },
              { case: { $eq: ["$_id", 2] }, then: "February" },
              { case: { $eq: ["$_id", 3] }, then: "March" },
              { case: { $eq: ["$_id", 4] }, then: "April" },
              { case: { $eq: ["$_id", 5] }, then: "May" },
              { case: { $eq: ["$_id", 6] }, then: "June" },
              { case: { $eq: ["$_id", 7] }, then: "July" },
              { case: { $eq: ["$_id", 8] }, then: "August" },
              { case: { $eq: ["$_id", 9] }, then: "September" },
              { case: { $eq: ["$_id", 10] }, then: "October" },
              { case: { $eq: ["$_id", 11] }, then: "November" },
              { case: { $eq: ["$_id", 12] }, then: "December" },
            ],
            default: "Invalid month",
          },
        },
      },
    },

    {
      $project: {
        month: "$monthName",
        acceptanceRate: {
          $divide: ["$acceptedOrders", "$totalOrders"],
        },
      },
    },
  ]);

  return result;
};

export default getOrderAcceptanceRateByYearService;
