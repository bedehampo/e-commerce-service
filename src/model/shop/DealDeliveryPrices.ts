import mongoose, { Schema } from "mongoose";

const deliveryLocationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: true,
      default: 0,
    },
    longitude: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: false,
    id: false,
  }
);

const DealDeliveryDetailsSchema = new mongoose.Schema(
  {
    dealer: {
      type: Number,
      required: true,
    },
    deliveryCost: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: false,
    id: false,
  }
);

const gigDeliverySchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      default: 0,
    },
    merchantId: {
      type: mongoose.Types.ObjectId,
      ref: "merchant",
    },
    deliveryDetails: DealDeliveryDetailsSchema,
  },
  {
    timestamps: false,
    id: false,
  }
);

const kwikDeliverySchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      default: 0,
    },
    merchantId: {
      type: mongoose.Types.ObjectId,
      ref: "merchant",
    },
    deliveryDetails: DealDeliveryDetailsSchema,
  },
  {
    timestamps: false,
    id: false,
  }
);

const DealDeliveryPricesSchema = new mongoose.Schema(
  {
    deliveryAddress: deliveryLocationSchema,
    deliveryAddressDescription: {
      type: String,
      required: true,
    },
    receiversName: {
      type: String,
      required: true,
    },
    receiversPhoneNumber: {
      type: String,
      required: true,
    },
    gig: gigDeliverySchema,
    kwik: kwikDeliverySchema,
  },
  {
    timestamps: true,
  }
);

export const DealDeliveryPrices = mongoose.model(
  "dealdeliveryprices",
  DealDeliveryPricesSchema
);
