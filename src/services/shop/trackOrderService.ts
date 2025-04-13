import { NotFoundError } from "../../errors";
import { Order } from "../../model/shop/order";

const trackOrder = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }
  return order;
};

export default trackOrder;
