import { Order } from "../../model/shop/order";
import { OrderStatus } from "../../types/order";

const getAverageOrderValueStatsByYear = async (year: number) => {
  const averageOrderValuePerMonth = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalOrderValue: { $sum: "$price" },
        totalOrders: { $sum: 1 },
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
        _id: 0,
        month: "$monthName",
        totalOrderValue: 1,
        totalOrders: 1,
        averageOrderValue: { $divide: ["$totalOrderValue", "$totalOrders"] },
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);
  return averageOrderValuePerMonth;
};

export default getAverageOrderValueStatsByYear;
