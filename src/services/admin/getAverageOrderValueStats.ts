import { Order } from "../../model/shop/order";
import { OrderStatus } from "../../types/order";

const getAverageOrderValueStats = async () => {
  const totalOrders = await Order.countDocuments();

  let averageOrderValue: any = await Order.aggregate([
    {
      $group: {
        _id: null,
        averageOrderValue: { $avg: "$price" },
      },
    },
  ]);

  if (averageOrderValue.length > 0) {
    averageOrderValue = averageOrderValue[0].averageOrderValue;
  } else {
    averageOrderValue = 0;
  }

  const result = await Order.aggregate([
    {
      $group: {
        _id: "$shop",
        averageOrderValue: { $avg: "$price" },
        totalOrders: { $sum: 1 },
        totalRevenueGenerated: {
          $sum: {
            $cond: [{ $eq: ["$status", OrderStatus.DELIVERED] }, "$price", 0],
          },
        },
        standardDeviation: {
          $stdDevPop: "$price",
        },
        orderValues: { $push: "$price" },
      },
    },
    {
      $project: {
        averageOrderValue: 1,
        totalOrders: 1,
        totalRevenueGenerated: 1,
        variance: {
          //square of standard deviation
          $pow: ["$standardDeviation", 2],
        },
        // variance2:{
        //     //For each number in the dataset, subtract the averageOrderValue and square the result. Then, take the average of those squared differences.
        //     $avg: {
        //       $map: {
        //         input: "$orderValues",
        //         as: "orderValue",
        //         in: {
        //           $pow: [
        //             { $subtract: ["$$orderValue", "$averageOrderValue"] },
        //             2,
        //           ],
        //         },
        //       },
        //     },
        // }
      },
    },
    {
      $lookup: {
        from: "shops",
        localField: "_id",
        foreignField: "_id",
        as: "shop",
      },
    },
    {
      $unwind: "$shop",
    },
    {
      $project: {
        shopName: "$shop.brand_name",
        averageOrderValue: 1,
        totalOrders: 1,
        totalRevenueGenerated: 1,
        variance: 1,
        variance2: 1,
      },
    },
    {
      $sort: { shopName: 1 },
    },
  ]);
  return {
    totalOrders,
    averageOrderValue,
    stats: result,
  };
};

export default getAverageOrderValueStats;
