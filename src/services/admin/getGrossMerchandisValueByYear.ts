import { Order } from "../../model/shop/order";
import { OrderStatus } from "../../types/order";

export const getGrossMerchandiseValueByYear = async (year: number) => {
  //get gross merchandise value from January to December
  const grossMerchandiseValuePerMonth = await Order.aggregate([
    {
      $match: {
        status: OrderStatus.DELIVERED,
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalPrice: { $sum: "$price" },
      },
    },
    {
      $addFields: {
        monthName: {
          $switch: {
            branches: [
              { case: { $eq: ["$_id.month", 1] }, then: "January" },
              { case: { $eq: ["$_id.month", 2] }, then: "February" },
              { case: { $eq: ["$_id.month", 3] }, then: "March" },
              { case: { $eq: ["$_id.month", 4] }, then: "April" },
              { case: { $eq: ["$_id.month", 5] }, then: "May" },
              { case: { $eq: ["$_id.month", 6] }, then: "June" },
              { case: { $eq: ["$_id.month", 7] }, then: "July" },
              { case: { $eq: ["$_id.month", 8] }, then: "August" },
              { case: { $eq: ["$_id.month", 9] }, then: "September" },
              { case: { $eq: ["$_id.month", 10] }, then: "October" },
              { case: { $eq: ["$_id.month", 11] }, then: "November" },
              { case: { $eq: ["$_id.month", 12] }, then: "December" },
            ],
            default: "Invalid month",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$monthName",
        totalPrice: 1,
      },
    },
  ]);

  return {
    grossMerchandiseValuePerMonth,
  };
};

export default getGrossMerchandiseValueByYear;
