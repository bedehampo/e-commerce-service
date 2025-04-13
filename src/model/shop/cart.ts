import mongoose from "mongoose";

// prospective schema for the products field in the future
const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    cartItems: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "cartitem",
    },
  },
  { timestamps: true, collection: "carts" }
);

// Apply the autopopulate plugin to the 'product' field
// CartItemSchema.plugin(autopopulate);

export const Cart = mongoose.model("cart", CartSchema);
