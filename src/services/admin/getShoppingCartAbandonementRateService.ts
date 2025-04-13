import { CartItem } from "../../model/shop/cartItem";
import { Order } from "../../model/shop/order";
import { Shop } from "../../model/shop/shop";
import { CartItemStatus, OrderPaymentStatus } from "../../types/order";

const getShoppingCartAbandonementRateStatsService = async () => {
  //total number of cart items
  const totalCart = await CartItem.countDocuments({});

  //total value of cart items, this is the sum of all the cart items amount field multiplied by the quantity field
  let totalCartValue: any = await CartItem.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ["$amount", "$quantity"] } },
      },
    },
  ]);

  if (totalCartValue.length === 0) {
    totalCartValue = 0;
  } else {
    totalCartValue = totalCartValue[0].total;
  }

  const aggregatePipeline = [
    // Stage 1: Calculate total checkouts
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "shop",
        as: "orders",
      },
    },
    {
      $addFields: {
        totalCheckouts: {
          $size: {
            $filter: {
              input: "$orders",
              as: "order",
              cond: { $eq: ["$$order.paymentStatus", "paid"] },
            },
          },
        },
      },
    },
    // Stage 2: Calculate total abandoned carts
    {
      $lookup: {
        from: "cart_items",
        let: { shopId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$shop", "$$shopId"] },
                  { $eq: ["$status", "active"] },
                  {
                    $lt: ["$createdAt", { $subtract: [new Date(), 259200000] }],
                  }, // 3 days in milliseconds
                ],
              },
            },
          },
        ],
        as: "abandonedCarts",
      },
    },
    {
      $addFields: {
        totalAbandonedCarts: { $size: "$abandonedCarts" },
      },
    },
    // Stage 3: Calculate abandonment rate
    {
      $addFields: {
        totalCartItems: { $size: "$abandonedCarts" },
        cartAbandonmentRate: {
          $multiply: [
            { $divide: [{ $size: "$abandonedCarts" }, { $size: "$orders" }] },
            100,
          ],
        },
      },
    },
    // Stage 4: Calculate total revenue generated
    {
      $match: { "orders.paymentStatus": "paid" },
    },
    {
      $unwind: "$orders",
    },
    {
      $group: {
        _id: "$_id",
        totalRevenueGenerated: { $sum: "$orders.amount" },
        totalCheckouts: { $first: "$totalCheckouts" },
        totalAbandonedCarts: { $first: "$totalAbandonedCarts" },
        cartAbandonmentRate: { $first: "$cartAbandonmentRate" },
      },
    },
  ];
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const query2 = [
    // {
    //   $lookup: {
    //     from: "orders",
    //     pipeline: [
    //       {
    //         $match: {
    //           $expr: { $eq: ["$shop", "$_id"] },
    //         },
    //       },
    //     ],
    //     as: "orders",
    //   },
    // },
    {
      $lookup: {
        from: "cart_items",
        localField: "_id",
        foreignField: "shop",
        as: "cartItems",
      },
    },
    // {
    //   $project: {
    //     _id: 1,
    //     shopLogoName: 1,
    //     shopLogoUrl: 1,
    //     products: 1,
    //     totalCheckouts: {
    //       $sum: {
    //         $cond: [{ $eq: ["$orders.paymentStatus", "paid"] }, 1, 0],
    //       },
    //     },
    //     totalAbandonedCarts: {
    //       $sum: {
    //         $cond: [
    //           {
    //             $and: [
    //               { $eq: ["$cartItems.status", "active"] },
    //               { $lt: ["$cartItems.createdAt", threeDaysAgo] },
    //             ],
    //           },
    //           1,
    //           0,
    //         ],
    //       },
    //     },
    //     cartAbandonmentRate: {
    //       $cond: [
    //         { $gt: [{ $size: "$cartItems" }, 0] }, // Check if cartItems is not empty
    //         {
    //           $multiply: [
    //             {
    //               $divide: [
    //                 {
    //                   $sum: {
    //                     // Reuse the abandoned carts calculation
    //                     $cond: [
    //                       {
    //                         $and: [
    //                           { $eq: ["$cartItems.status", "active"] },
    //                           { $lt: ["$cartItems.createdAt", threeDaysAgo] },
    //                         ],
    //                       },
    //                       1,
    //                       0,
    //                     ],
    //                   },
    //                 },
    //                 { $size: "$cartItems" }, // Total cart count
    //               ],
    //             },
    //             100, // Multiply by 100 for percentage
    //           ],
    //         },
    //         0, // Default to 0 if cartItems is empty
    //       ],
    //     },
    //     totalRevenueGenerated: {
    //       $sum: {
    //         $cond: [
    //           { $eq: ["$orders.paymentStatus", "paid"] },
    //           "$orders.amount",
    //           0,
    //         ],
    //       },
    //     },
    //   },
    // },
  ];

  //const shopStats = await Shop.aggregate(query2);

  const shops = await Shop.find(); // Fetch all shops

  const shopStats = [];

  for (const shop of shops) {
    const shopStat = {
      shopId: shop._id, // Assuming _id is your shop identifier
      totalCheckouts: 0,
      totalAbandonedCarts: 0,
      cartAbandonmentRate: 0,
      totalRevenueGenerated: 0,
    };

    // Total Checkouts
    shopStat.totalCheckouts = await Order.countDocuments({
      shop: shop._id,
      paymentStatus: "paid",
    });

    // Total Abandoned Carts
    shopStat.totalAbandonedCarts = await CartItem.countDocuments({
      shop: shop._id,
      status: "active",
      createdAt: { $lt: threeDaysAgo },
    });

    // Total Cart Items (for abandonment rate)
    const totalCartItems = await CartItem.countDocuments({ shop: shop._id });

    // Abandonment Rate
    if (totalCartItems > 0) {
      shopStat.cartAbandonmentRate =
        (shopStat.totalAbandonedCarts / totalCartItems) * 100;
    }

    // Total Revenue Generated
    const paidOrders = await Order.find({
      shop: shop._id,
      paymentStatus: "paid",
    });
    shopStat.totalRevenueGenerated = paidOrders.reduce(
      (sum, order) => sum + order.price,
      0
    );

    shopStats.push(shopStat);
  }

  return {
    totalCart,
    totalCartValue,
    shopStats,
  };
};

export default getShoppingCartAbandonementRateStatsService;
