import mongoose from "mongoose";

const DeliveryMerchantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "delivery_merchants",
  }
);

export const DeliveryMerchant = mongoose.model(
  "deliveryMerchant",
  DeliveryMerchantSchema
);
