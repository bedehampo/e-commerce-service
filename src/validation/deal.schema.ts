import { object, string, number, array, TypeOf, boolean } from "zod";

const createDealPayload = {
  body: object({
    // userId: number({
    // 	required_error: "user id is required ",
    // 	invalid_type_error: "user id must be a number",
    // }),
    image: array(
      string({
        required_error: "image is required",
        invalid_type_error: "image must be a string",
      })
    ),
    category: string({
      required_error: "category is required",
      invalid_type_error: "category must be a string",
    }),
    productName: string({
      required_error: "product name is required",
      invalid_type_error: "product name must be a string",
    }),
    quantity: number({
      required_error: "quantity is required",
      invalid_type_error: "quantity must be a number",
    }),
    price: number({
      required_error: "price is required",
      invalid_type_error: "price must be a number",
    }),
    marketPrice: number({
      required_error: "market price is required",
      invalid_type_error: "market price must be a number",
    }),
    state: string({
      required_error: "state is required",
      invalid_type_error: "state must be a string",
    }),
    lga: string({
      required_error: "lga is required",
      invalid_type_error: "lga must be a string",
    }),
    description: string({
      required_error: "description is required",
      invalid_type_error: "description must be a string",
    }),
    latitude: string({
      required_error: "Latitude is required",
      invalid_type_error: "Latitude should be a number",
    }),
    longitude: string({
      required_error: "Longitude is required",
      invalid_type_error: "Longitude should be a number",
    }),
    address: string({
      required_error: "Address is required",
      invalid_type_error: "Address should be a string",
    }),
  }),
};

export const CreateDealSchema = object({
  ...createDealPayload,
});

export type CreateDealInput = TypeOf<typeof CreateDealSchema>;

const dealRequestPayload = {
  body: object({
    dealId: string({
      required_error: "deal id required",
      invalid_type_error: "deal id must be a string",
    }),
    quantity: number({
      required_error: "quantity is required",
      invalid_type_error: "quantity must be a number",
    }),
    amount: number({
      required_error: "amount is required",
      invalid_type_error: "amount must be a number",
    }),
  }),
};

export const DealRequestSchema = object({
  ...dealRequestPayload,
});

export type DealRequestInput = TypeOf<typeof DealRequestSchema>;

const updateRequestPayload = {
  body: object({
    requestId: string({
      required_error: "request id is required",
      invalid_type_error: "request id must be a string",
    }),
    quantity: number({
      required_error: "quantity is required",
      invalid_type_error: "quantity must be a number",
    }),
    amount: number({
      required_error: "amount is required",
      invalid_type_error: "amount must be a number",
    }),
  }),
};

export const UpdateRequestSchema = object({
  ...updateRequestPayload,
});

export type UpdateRequestInput = TypeOf<typeof UpdateRequestSchema>;

const updateDealPayload = {
  body: object({
    dealId: string({
      required_error: "deal id is required",
      invalid_type_error: "deal id must be a string",
    }),
    image: array(
      string({
        required_error: "image is required",
        invalid_type_error: "image must be a string",
      })
    ),
    quantity: number({
      required_error: "quantity is required",
      invalid_type_error: "quantity must be a number",
    }).optional(),
    category: string({
      invalid_type_error: "category must be a string",
    }).optional(),
    productName: string({
      invalid_type_error: "product name must be a string",
    }).optional(),
    price: number({
      invalid_type_error: "price must be a number",
    }).optional(),
    marketPrice: number({
      invalid_type_error: "market price must be a number",
    }).optional(),
    state: string({
      invalid_type_error: "state must be a string",
    }).optional(),
    address: string({
      invalid_type_error: "address must be a string",
    }).optional(),
    lga: string({
      invalid_type_error: "lga must be a string",
    }).optional(),
    description: string({
      invalid_type_error: "description must be a string",
    }).optional(),
    latitude: string({
      invalid_type_error: "Latitude should be a number",
    }).optional(),
    longitude: string({
      invalid_type_error: "Longitude should be a number",
    }).optional(),
  }),
};

export const UpdateDealSchema = object({
  ...updateDealPayload,
});

export type UpdateDealInput = TypeOf<typeof UpdateDealSchema>;

const dealsNearByPayload = {
  body: object({
    query: string().optional(),
    location: object({
      latitude: number({
        required_error: "Latitude is required",
      }),
      longitude: number({
        required_error: "Longitude is required",
      }),
    }),
  }),
};

export const DealsNearBySchema = object({
  ...dealsNearByPayload,
});

export type DealsNearByInput = TypeOf<typeof DealsNearBySchema>;

const CalculateDeliverySchemaPayload = {
  body: object({
    dealRequestId: string({
      required_error: "deal id is required",
      invalid_type_error: "deal id must be a string",
    }),
    deliveryAddress: object({
      latitude: number({
        required_error: "latitude is required",
      }),
      longitude: number({
        required_error: "longitude is required",
      }),
    }),
    deliveryAddressDescription: string({
      required_error:
        "Address Description is required, key: deliveryAddressDescription",
    }),
    receiversName: string({
      required_error: "Receiver's name is required, key: receiversName",
    }),
    receiversPhoneNumber: string({
      required_error:
        "Receivers Phone Number is required, key: receiversPhoneNumber",
    }),
  }),
};

export const CalculateDeliverySchema = object({
  ...CalculateDeliverySchemaPayload,
});

export type CalculateDeliveryInput = TypeOf<typeof CalculateDeliverySchema>;

const initiateDealPaymentPayload = {
  body: object({
    dealRequestId: string({
      required_error: "deal request id is required",
      invalid_type_error: "deal request id must be a string",
    }),
    deliveryDetailsId: string({
      required_error: "delivery details id is required",
      invalid_type_error: "delivery details id must be a string",
    }),
    deliveryMerchant: string({
      required_error: "Delivery Merchant is required, key: deliveryMerchant",
    }),
  }),
};

export const InitiateDealPaymentSchema = object({
  ...initiateDealPaymentPayload,
});

export type InitiateDealPaymentInput = TypeOf<typeof InitiateDealPaymentSchema>;

const completeDealPaymentPayload = {
  body: object({
    transactionReference: string({
      required_error:
        "Transaction Reference is required, key: transactionReference",
    }),
    pin: string({
      required_error: "Pin is required, key: pin",
    }),
  }),
};

export const CompleteDealPaymentSchema = object({
  ...completeDealPaymentPayload,
});

export type CompleteDealPaymentInput = TypeOf<typeof CompleteDealPaymentSchema>;
