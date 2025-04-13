import moment from "moment";
import { Shop } from "../../model/shop/shop";
import { OrderGroup } from "../../model/shop/OrderGroup";
import { CartItemStatus, OrderStatus } from "../../types/order";
import { Order } from "../../model/shop/order";
import { CartItem } from "../../model/shop/cartItem";

const getShopOverviewStats = async () => {
  const shopCount = await Shop.countDocuments();
  let orderCount = 0;
  let newCustomers = 0;
  let returningCustomers = 0;

  const oneWeekAgo = moment().subtract(1, "weeks").toDate();

  // Count the number of shops created within the last week
  const shopsThisWeek = await Shop.countDocuments({
    createdAt: { $gte: oneWeekAgo },
  });

  // Count the number of shops created before last week
  const shopsLastWeek = await Shop.countDocuments({
    createdAt: { $lt: oneWeekAgo },
  });

  let shopGrowth = 0;
  if (shopsThisWeek !== 0) {
    shopGrowth = (shopsThisWeek / shopsLastWeek) * 100;
  }

  //count total accepted orders
  const totalAcceptedOrders = await Order.countDocuments({
    status: OrderStatus.ACCEPTED,
  });

  //count total orders that are not pending
  const totalCompletedOrders = await Order.countDocuments({
    status: { $ne: OrderStatus.PENDING },
  });

  //get order acceptance rate
  const orderAcceptanceRate = totalAcceptedOrders / totalCompletedOrders;

  //get order acceptance rate growth

  //get total accepted orders as at last week
  const totalAcceptedOrdersLastWeek = await Order.countDocuments({
    status: OrderStatus.ACCEPTED,
    createdAt: { $lt: oneWeekAgo },
  });

  //get total completed orders as at last week
  const totalCompletedOrdersLastWeek = await Order.countDocuments({
    status: { $ne: OrderStatus.PENDING },
    createdAt: { $lt: oneWeekAgo },
  });

  let orderAcceptanceRateLastWeek = 0;

  if (totalCompletedOrdersLastWeek !== 0) {
    orderAcceptanceRateLastWeek =
      totalAcceptedOrdersLastWeek / totalCompletedOrdersLastWeek;
  }

  let orderAcceptanceRateGrowth = 0;

  if (orderAcceptanceRateLastWeek !== 0) {
    orderAcceptanceRateGrowth =
      ((orderAcceptanceRate - orderAcceptanceRateLastWeek) /
        orderAcceptanceRateLastWeek) *
      100;
  }

  //get total orders
  const totalOrders = await Order.countDocuments();

  //count how many orders were from customers who have never ordered before

  //count returning customers

  const totalOrdersFromReturningCustomers = await Order.countDocuments({
    returningCustomer: true,
  });

  let percentageOfOrdersFromReturningCustomers = 0;

  if (totalOrders !== 0) {
    percentageOfOrdersFromReturningCustomers =
      (totalOrdersFromReturningCustomers / totalOrders) * 100;
  }

  //count new customers
  const totalOrdersFromNewCustomers = await Order.countDocuments({
    returningCustomer: false,
  });

  let percentageOfOrdersFromNewCustomers = 0;

  if (totalOrders !== 0) {
    percentageOfOrdersFromNewCustomers =
      (totalOrdersFromNewCustomers / totalOrders) * 100;
  }

  // get gross merchandise value by summing the price field of all orders in which status is delivered
  let totalGrossMerchandiseLastWeekQuery = await Order.aggregate([
    {
      $match: {
        status: OrderStatus.DELIVERED,
        createdAt: { $lt: oneWeekAgo },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$price" },
      },
    },
  ]);

  let totalGrossMerchandiseValueLastWeek;

  if (totalGrossMerchandiseLastWeekQuery.length > 0) {
    totalGrossMerchandiseValueLastWeek =
      totalGrossMerchandiseLastWeekQuery[0].total;
  } else {
    totalGrossMerchandiseValueLastWeek = 0;
  }

  let totalGrossMerchandiseValueQuery = await Order.aggregate([
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

  // get percentage increase in gross merchandise value
  let grossMerchandiseValueGrowth = 0;

  if (totalGrossMerchandiseValueLastWeek !== 0) {
    grossMerchandiseValueGrowth =
      ((totalGrossMerchandiseValue - totalGrossMerchandiseValueLastWeek) /
        totalGrossMerchandiseValueLastWeek) *
      100;
  }

  // get average order value

  //get total delivered orders
  const totalDeliveredOrders = await Order.countDocuments({
    status: OrderStatus.DELIVERED,
  });

  //get average order value
  const averageOrderValue = totalGrossMerchandiseValue / totalDeliveredOrders;

  //get total delivered orders as at last week

  const totalDeliveredOrdersLastWeek = await Order.countDocuments({
    status: OrderStatus.DELIVERED,
    createdAt: { $lt: oneWeekAgo },
  });

  //get average order value as at last week
  let averageOrderValueLastWeek = 0;

  if (totalDeliveredOrdersLastWeek !== 0) {
    averageOrderValueLastWeek =
      totalGrossMerchandiseValueLastWeek / totalDeliveredOrdersLastWeek;
  }

  //get percentage increase in average order value
  let averageOrderValueGrowth = 0;

  if (averageOrderValueLastWeek !== 0) {
    averageOrderValueGrowth =
      ((averageOrderValue - averageOrderValueLastWeek) /
        averageOrderValueLastWeek) *
      100;
  }

  //get shopping cart abandonment rate
  //get carts older than 3 days
  const threeDaysAgo = moment().subtract(3, "days").toDate();
  const threeDaysAgoLastWeek = moment()
    .subtract(3, "days")
    .subtract(1, "weeks")
    .toDate();

  //get total number of carts older than 3 days
  const totalCartsOlderThanThreeDays = await CartItem.countDocuments({
    createdAt: { $lt: threeDaysAgo },
    status: { $ne: CartItemStatus.ACTIVE },
  });

  //get total number of carts
  const totalCarts = await CartItem.countDocuments({});

  //get abandonment rate
  let totalCartsOlderThanThreeDaysPercentage =
    (totalCartsOlderThanThreeDays / totalCarts) * 100;

  //get total number of carts older than 3 days as at last week
  const totalCartsOlderThanThreeDaysLastWeek = await Order.countDocuments({
    createdAt: { $lt: threeDaysAgoLastWeek },
    status: { $ne: CartItemStatus.ORDERED },
  });

  //convert to 2 decimal places
  totalCartsOlderThanThreeDaysPercentage = Number(
    totalCartsOlderThanThreeDaysPercentage.toFixed(2)
  );

  //get abandonement rate as at last week
  const totalCartsOlderThanThreeDaysLastWeekPercentage =
    (totalCartsOlderThanThreeDaysLastWeek / totalCarts) * 100;

  //get percentage increase in shopping cart abandonment rate

  let shoppingCartAbandonmentRateGrowth = 0;

  if (totalCartsOlderThanThreeDaysLastWeek !== 0) {
    shoppingCartAbandonmentRateGrowth =
      ((totalCartsOlderThanThreeDays - totalCartsOlderThanThreeDaysLastWeek) /
        totalCartsOlderThanThreeDaysLastWeek) *
      100;
  }

  //get number of transactions
  const totalTransactions = await Order.countDocuments({
    transactionReference: { $exists: true },
  });

  //get number of transactions as at last week
  const totalTransactionsLastWeek = await Order.countDocuments({
    transactionReference: { $exists: true },
    createdAt: { $lt: oneWeekAgo },
  });

  //get percentage increase in number of transactions
  let transactionsGrowth = 0;

  if (totalTransactionsLastWeek !== 0) {
    transactionsGrowth =
      ((totalTransactions - totalTransactionsLastWeek) /
        totalTransactionsLastWeek) *
      100;
  }

  //get churn rate

  const result = {
    shopCount: {
      currentCount: shopCount,
      countLastWeek: shopsLastWeek,
      growth: shopGrowth,
    },
    order: {
      totalOrders,
      orderCount,
      newCustomers: percentageOfOrdersFromNewCustomers,
      returningCustomers: percentageOfOrdersFromReturningCustomers,
    },
    // chunRate: {
    //   value: 0,
    //   percentageIncrease: 0,
    // },
    orderAcceptanceRate: {
      value: orderAcceptanceRate,
      percentageIncrease: orderAcceptanceRateGrowth,
    },
    grossMerchandiseValue: {
      value: totalGrossMerchandiseValue,
      percentageIncrease: grossMerchandiseValueGrowth,
    },
    averageOrderValue: {
      value: averageOrderValue,
      percentageIncrease: averageOrderValueGrowth,
    },
    shoppingCartAbandonementRate: {
      value: totalCartsOlderThanThreeDaysPercentage,
      percentageIncrease: shoppingCartAbandonmentRateGrowth,
    },
    number_of_transactions: {
      value: totalTransactions,
      percentageIncrease: transactionsGrowth,
    },
  };
  return result;
};

export default getShopOverviewStats;
