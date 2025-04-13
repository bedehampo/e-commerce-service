import moment from "moment";
import { CartItemStatus } from "../../types/order";
import { CartItem } from "../../model/shop/cartItem";

const getShoppingCartAbandonementRateStatsByYearService = async (
  year: number
) => {
  const abandonmentRateByMonth = await CartItem.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
        status: { $ne: CartItemStatus.ORDERED },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalCarts: { $sum: 1 },
        abandonedCarts: {
          $sum: {
            $cond: [
              { $lt: ["$createdAt", { $subtract: [new Date(), 259200000] }] }, // 259200000 ms = 3 days
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
    // {
    //   $project: {
    //     _id: 0,
    //     month: "$monthName",
    //     abandonmentRate: {
    //       $multiply: [{ $divide: ["$abandonedCarts", "$totalCarts"] }, 100],
    //     },
    //   },
    // },
    // { $sort: { month: 1 } }, // Optionally, sort by month
  ]);

  return abandonmentRateByMonth;
};

export default getShoppingCartAbandonementRateStatsByYearService;
