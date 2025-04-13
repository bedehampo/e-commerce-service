import mongoose, { Schema } from "mongoose";

const RatingReviewSchema = new mongoose.Schema(
  {
    user: {
      type: Number,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: null
    },
  },
  {
    timestamps: true,
    collection: "ratings_reviews",
  }
);

export const Review = mongoose.model("review", RatingReviewSchema);
