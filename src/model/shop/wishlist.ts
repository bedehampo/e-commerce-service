import mongoose from "mongoose";

const WishListSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
    ],
  },
  {
    timestamps: true,
    collection: "wishlists",
  }
);

export const WishList = mongoose.model("wishlist", WishListSchema);
