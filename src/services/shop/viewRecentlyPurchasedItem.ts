import { Order } from "../../model/shop/order";
import { Product } from "../../model/shop/product";
import { OrderDeliveryStatus, OrderStatus } from "../../types/order";

const viewRecentlyPurchasedItem = async (userId) => {
  const mostRecentOrder = await Order.findOne({
    suggestedReview: false,
    // status: OrderStatus.DELIVERED,
    deliveryStatus:OrderDeliveryStatus.DELIVERED
  })
    .sort({ createdAt: -1 })
    .populate("cartItem");

  if (!mostRecentOrder) {
    return null;
  }
  // update suggestedReview to true
  mostRecentOrder.suggestedReview = true;
  await mostRecentOrder.save();
  //@ts-ignore
  const product = await Product.findById(mostRecentOrder.cartItem.product);

  return product;
};

export default viewRecentlyPurchasedItem;
