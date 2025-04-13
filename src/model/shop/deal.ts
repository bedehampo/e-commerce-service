import mongoose from "mongoose";

export enum DealStatus {
  Active = "active",
  Closed = "closed",
  Deleted = "deleted",
}

const geoJsonSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      index: "2dsphere",
    },
  },
  { _id: false }
);

const DealSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
    },
    image: {
      type: [String],
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    dealType: {
      type: String,
      required: true,
      enum: ["products", "services"],
      default: "products",
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      float: true,
      default: 0.0,
    },
    marketPrice: {
      type: Number,
      required: true,
      float: true,
      default: 0.0,
    },
    discount: {
      type: Number,
      required: true,
      float: true,
      default: 0.0,
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "state",
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    lga: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: DealStatus,
      default: DealStatus.Active,
    },
    requests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dealRequest",
      },
    ],
    location: geoJsonSchema,
  },
  {
    timestamps: true,
    collection: "deals",
  }
);

export const Deal = mongoose.model("deal", DealSchema);
