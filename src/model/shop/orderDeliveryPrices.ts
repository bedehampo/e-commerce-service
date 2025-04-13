import mongoose, { Schema } from "mongoose";
import { CartItem } from "./cartItem";
import { DeliveryMerchant } from "./deliveryMerchant";
import { UserDeliveryAddress } from "./userDeliveryAddress";

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

const ShopDeliveryDetailsSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shop",
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
      ref: DeliveryMerchant,
    },
    deliveryDetails: [ShopDeliveryDetailsSchema],
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
    deliveryDetails: [ShopDeliveryDetailsSchema],
  },
  {
    timestamps: false,
    id: false,
  }
);

const dellyDeliverySchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      default: 0,
    },
    merchantId: {
      type: mongoose.Types.ObjectId,
      ref: "merchant",
    },
    deliveryDetails: [ShopDeliveryDetailsSchema],
  },
  {
    timestamps: false,
    id: false,
  }
);

const orionAthenaDeliverySchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      default: 0,
    },
    merchantId: {
      type: mongoose.Types.ObjectId,
      ref: "merchant",
    },
    deliveryDetails: [ShopDeliveryDetailsSchema],
  },
  {
    timestamps: false,
    id: false,
  }
);

const OrderDeliveryPricesSchema = new mongoose.Schema(
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
    cartItemIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: CartItem,
    },
    userDeliveryAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserDeliveryAddress,
    },
    dellymanCompanyId: {
      type: Number,
    },
    gig: gigDeliverySchema,
    kwik: kwikDeliverySchema,
    dellyman: dellyDeliverySchema,
  },
  {
    timestamps: true,
  }
);

export const OrderDeliveryPrices = mongoose.model(
  "orderdeliveryprices",
  OrderDeliveryPricesSchema
);
