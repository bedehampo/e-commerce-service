import { Product } from "../../model/shop/product";
import { CalculateDeliveryInput } from "../../validation/order.schema";
import GigService from "../../lib/gig";
import KwikDeliveryService from "../../lib/kwik";
import DellyDeliverymanService from "../../lib/dellyman";
import { NotFoundError, ServiceError } from "../../errors";
import { DeliveryMerchant } from "../../model/shop/deliveryMerchant";
import { Shop } from "../../model/shop/shop";
import { OrderDeliveryPrices } from "../../model/shop/orderDeliveryPrices";
import config from "../../config";
import {
  CartItemStatus,
  DeliveryCompanies,
  DellymanGetQuotesPayload,
  ICartItem,
  KwikCalculatePricePayload,
  KwikStatusCode,
} from "../../types/order";
import { IShop } from "../../types/shop";
import { IUser } from "../../types/user";
import { checkUserById } from "../../middlewares/validators";
import { UserService } from "../../lib/userService";
import { CartItem } from "../../model/shop/cartItem";
import { UserDeliveryAddress } from "../../model/shop/userDeliveryAddress";
import mongoose from "mongoose";

export interface IDeliveryDetails {
  shop: string;
  deliveryCost: number;
  quantity: number;
  // deliveryMerchant?: string;
}

const calculateDeliveryService = async (
  data: CalculateDeliveryInput["body"],
  userId: number,
  session: any,
  userService: UserService
) => {
  const { cartItemIds, userDeliveryAddressId } = data;
  const userDeliveryAddress = await UserDeliveryAddress.findOne({
    userId: userId,
  });

  if (!userDeliveryAddress) {
    throw new Error("User delivery address not found");
  }

  // console.log(userDeliveryAddress);

  const address = userDeliveryAddress.addresses.find(
    (address) =>
      address._id.equals(userDeliveryAddressId) && address.status === "active"
  );

  if (!address) {
    throw new Error("Active delivery address not found");
  }

  const {
    latitude,
    longitude,
    deliveryAddress,
    receiversName,
    receiversPhoneNumber,
  } = address;

  const user = await checkUserById(userId, userService);

  const cart = await CartItem.find({
    user: userId,
    status: CartItemStatus.ACTIVE,
    _id: { $in: cartItemIds },
  })
    .populate({
      path: "product",
      model: Product,
    })
    .sort({ createdAt: -1 })
    .exec();
  // const user = (await User.findById(userId).populate({
  //   path: "cart",
  //   populate: {
  //     path: "product",
  //     model: Product,
  //   },
  // })) as IUser;
  if (!cart.length) {
    throw new NotFoundError("Cart is empty");
  }

  const shopIds: Set<string> = new Set();
  let totalGigDeliveryFee = 0;
  let totalOrionDeliveryFee = 0;
  let totalAthenaDeliveryFee = 0;

  let shopOrderMapping = {};

  for (const item of cart) {
    const shop = await Shop.findById(item.shop).select(
      "official_email official_phone_number brand_name address location"
    );
    //@ts-ignore
    shopOrderMapping[item.shop] = shopOrderMapping[item.shop.toString()]
      ? {
          //@ts-ignore
          quantity:
            item.quantity + shopOrderMapping[item.shop.toString()].quantity,
        }
      : {
          quantity: item.quantity,
          ...shop.toJSON(),
        };
    //@ts-ignore
    shopIds.add(item.shop);
  }

  //  GIG Calculations
  // let calculateDeliveryCostPayloadStore = [];
  // const authResponse = await GigService.login();
  // for (let shopId of shopIds) {
  //   const shop = await Shop.findById(shopId).populate("user");
  //   let deliveryCostPayload = {
  //     SenderAddress: shop.address,
  //     SenderName: user.firstName,
  //     ReceiverName: receiversName,
  //     ReceiverAddress: deliveryAddressDescription,
  //     ReceiverPhoneNumber: receiversPhoneNumber,
  //     VehicleType: "BIKE",
  //     SenderPhoneNumber: user.mobileNumber,
  //     ReceiverStationId: "4",
  //     SenderStationId: "4",
  //     UserId: authResponse.UserId,
  //     ReceiverLocation: {
  //       Latitude: deliveryAddress.latitude.toString(),
  //       Longitude: deliveryAddress.longitude.toString(),
  //       // Latitude: "6.56947",
  //       // Longitude: "3.3883414",
  //     },
  //     SenderLocation: {
  //       Latitude: shop.location.coordinates[1].toString(),
  //       Longitude: shop.location.coordinates[0].toString(),
  //       // Latitude: "6.459183655304364",
  //       // Longitude: "3.4494126947893187",
  //     },
  //     PreShipmentItems: [
  //       {
  //         ItemName: "jhhh",
  //         Quantity: shopOrderMapping[shopId as string].quantity,
  //         ItemType: "Normal",
  //         ShipmentType: "Regular",
  //       },
  //     ],
  //   };
  //   // calculateDeliveryCostPayloadStore.push(deliveryCostPayload);
  //   GigService.setToken(authResponse.access_token);
  //   let deliveryCost = await GigService.calculateShipmentPrice(
  //     deliveryCostPayload
  //   );
  //   // console.log("delivery cost", deliveryCost);

  //   shopOrderMapping[shopId as string] = shopOrderMapping[shopId as string]
  //     ? {
  //         deliveryCost: deliveryCost,
  //       }
  //     : {
  //         deliveryCost: deliveryCost,
  //       };
  //   shopOrderMapping[shopId as string].address = shop.address;
  //   totalGigDeliveryFee += Number(deliveryCost);
  // }
  // let gigShopDeliveryDetails: IDeliveryDetails[] = [];
  // for (let shopId of shopIds) {
  //   let shopDeliveryDetailPayload = {
  //     shop: shopId as string,
  //     deliveryCost: shopOrderMapping[shopId as string].deliveryCost as number,
  //     quantity: shopOrderMapping[shopId as string].quantity as number,
  //   };
  //   gigShopDeliveryDetails.push(shopDeliveryDetailPayload);
  // }

  //end of GIG Calculations

  let receiversDetails = {
    receiversName,
    receiversPhoneNumber,
    deliveryAddress: {
      latitude: latitude,
      longitude: longitude,
    },
    deliveryAddressDescription: deliveryAddress,
  };

  //Kwik Calculations
  const kwikResponse = await kwikDeliveryCalculation(
    shopIds,
    shopOrderMapping,
    receiversDetails
  );

  let {
    totalKwikDeliveryFee,
    kwikShopDeliveryDetails,
    success: kwikSuccess,
  } = kwikResponse;

  // dellyman calculations
  const dellymanResponse = await dellymanCalculation(
    shopIds,
    shopOrderMapping,
    receiversDetails
  );

  let {
    totalDellymanDeliveryFee,
    dellymanShopDeliveryDetails,
    dellymanCompanyId,
    success: dellymanSuccess,
  } = dellymanResponse;

  const gigMerchant = await DeliveryMerchant.findOne({
    name: DeliveryCompanies.Gig,
  });

  const kwikMerchant = await DeliveryMerchant.findOne({
    name: DeliveryCompanies.Kwik,
  });

  const DellyManMerchant = await DeliveryMerchant.findOne({
    name: DeliveryCompanies.Dellyman,
  });

  let orderDeliveryPricesPayload: any = {
    cartItemIds,
    deliveryAddress: {
      latitude: latitude,
      longitude: longitude,
    },
    deliveryAddressDescription: deliveryAddress,
    receiversName,
    receiversPhoneNumber,
    userDeliveryAddress,
    dellymanCompanyId,
  };

  if (kwikSuccess) {
    orderDeliveryPricesPayload = {
      ...orderDeliveryPricesPayload,
      kwik: {
        price: totalKwikDeliveryFee,
        merchantId: kwikMerchant._id,
        deliveryDetails: kwikShopDeliveryDetails,
      },
    };
  }

  if (dellymanSuccess) {
    orderDeliveryPricesPayload = {
      ...orderDeliveryPricesPayload,
      dellyman: {
        price: totalDellymanDeliveryFee,
        merchantId: DellyManMerchant._id,
        deliveryDetails: dellymanShopDeliveryDetails,
      },
    };
  }

  const orderDeliveryPrices = new OrderDeliveryPrices(
    orderDeliveryPricesPayload
  );
  console.log("shshhshshshshshhhshshshs");
  orderDeliveryPrices.save({ session });

  let pickUpAddress = [];
  //loop through shopOrderMapping and get an array of all the .address field
  for (const shopId in shopOrderMapping) {
    pickUpAddress.push(shopOrderMapping[shopId].address);
  }

  await session.commitTransaction();
  session.endSession();
  // return orderDeliveryPrices;
  interface IDeliveryCompanies {
    name: string;
    price: number;
    imageUrl: string;
    merchantId: string;
  }
  const deliveryCompanies = [
    {
      name: "Motopay Logistics",
      price: 2200,
      imageUrl:
        "https://devmotopaymp.obs.af-south-1.myhuaweicloud.com/motopay.png",
      merchantId: new mongoose.Types.ObjectId("6542a0f261d1eb66658982b0"),
    },
  ];

  if (kwikSuccess) {
    deliveryCompanies.push({
      name: DeliveryCompanies.Kwik,
      price: totalKwikDeliveryFee,
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/en/c/ce/GIG_Logistics_logo.png",
      merchantId: kwikMerchant._id,
    });
  }

  if (dellymanSuccess) {
    deliveryCompanies.push({
      name: DeliveryCompanies.Dellyman,
      price: totalDellymanDeliveryFee,
      imageUrl:
        "https://devmotopaymp.obs.af-south-1.myhuaweicloud.com/dellyman.png",
      merchantId: DellyManMerchant._id,
    });
  }
  return {
    deliveryAddressDescription: deliveryAddress,
    id: orderDeliveryPrices._id,
    pickUpAddress,
    deliveryCompanies,
  };
};

export default calculateDeliveryService;

const kwikDeliveryCalculation = async (
  shopIds: Set<String>,
  shopOrderMapping,
  receiversDetails: {
    receiversName: string;
    receiversPhoneNumber: string;
    deliveryAddress: {
      latitude?: number;
      longitude?: number;
    };
    deliveryAddressDescription: string;
  }
): Promise<{
  totalKwikDeliveryFee: number;
  kwikShopDeliveryDetails: IDeliveryDetails[];
  success: boolean;
}> => {
  let totalKwikDeliveryFee = 0;
  let success = true;
  let authResponse;
  try {
    authResponse = await KwikDeliveryService.login();
  } catch (error) {
    return {
      totalKwikDeliveryFee: 0,
      kwikShopDeliveryDetails: [],
      success: false,
    };
  }

  let accessToken = authResponse.access_token;
  let vendorId = authResponse.vendor_details.vendor_id;
  let kwikShopDeliveryDetails: IDeliveryDetails[] = [];
  console.log("aloha");
  for (let shopId of shopIds) {
    const shop = shopOrderMapping[shopId as string];
    console.log("shop", shop);

    let deliveryCostPayload: KwikCalculatePricePayload = {
      access_token: accessToken,
      vendor_id: vendorId,
      custom_field_template: "pricing-template",
      domain_name: "staging-client-panel.kwik.delivery",
      timezone: 60,
      is_multiple_tasks: 1,
      layout_type: 0,
      pickup_custom_field_template: "pricing-template",
      has_pickup: 1,
      has_delivery: 1,
      auto_assignment: 1,
      user_id: authResponse.vendor_details.user_id,
      payment_method: 32,
      form_id: 2,
      vehicle_id: 4,
      delivery_instruction: receiversDetails.deliveryAddressDescription,
      is_loader_required: 0,
      loaders_amount: 0,
      loaders_count: 0,
      is_cod_job: 0,
      parcel_amount: 0,
      pickups: [
        {
          address: shop.address,
          name: shop.brand_name,
          latitude: shop.location.coordinates[1],
          longitude: shop.location.coordinates[0],
          // latitude: config.env.isDevelopment
          //   ? 30.7188978
          //   : shop.location.coordinates[1],
          // longitude: config.env.isDevelopment
          //   ? 76.8794589
          //   : shop.location.coordinates[0],
          phone: shop.official_phone_number,
          email: shop.official_email,
        },
      ],
      deliveries: [
        {
          address: receiversDetails.deliveryAddressDescription,
          name: receiversDetails.receiversName,
          latitude: receiversDetails.deliveryAddress.latitude,
          longitude: receiversDetails.deliveryAddress.longitude,
          // latitude: config.env.isDevelopment
          //   ? 30.6951827
          //   : shop.location.coordinates[1],
          // longitude: config.env.isDevelopment
          //   ? 76.8794589
          //   : shop.location.coordinates[0],
          phone: receiversDetails.receiversPhoneNumber,
          has_return_task: false,
          is_package_insured: 0,
        },
      ],
    };

    let response;
    try {
      response = await KwikDeliveryService.calculateShipmentPrice(
        deliveryCostPayload
      );
      if (response.status !== KwikStatusCode.ACTION_COMPLETE) {
        success = false;
      }
    } catch (error) {
      success = false;
    }

    console.log(success, "success kwik");

    if (success) {
      let deliveryCost = response.data.per_task_cost;
      // console.log("delivery cost", deliveryCost);

      //
      // shopOrderMapping[shopId as string] = shopOrderMapping[shopId as string]
      //   ? {
      //       deliveryCost: deliveryCost,
      //     }
      //   : {
      //       deliveryCost: deliveryCost,
      //     };
      let shopDeliveryDetailPayload = {
        shop: shopId as string,
        deliveryCost: Number(deliveryCost),
        quantity: shopOrderMapping[shopId as string].quantity as number,
      };
      kwikShopDeliveryDetails.push(shopDeliveryDetailPayload);
      totalKwikDeliveryFee += Number(deliveryCost);
    }
  }

  console.log("aloha again");
  return {
    totalKwikDeliveryFee,
    kwikShopDeliveryDetails,
    success,
  };
};

const dellymanCalculation = async (
  shopIds: Set<String>,
  shopOrderMapping,
  receiversDetails: {
    receiversName: string;
    receiversPhoneNumber: string;
    deliveryAddress: {
      latitude?: number;
      longitude?: number;
    };
    deliveryAddressDescription: string;
  }
): Promise<{
  totalDellymanDeliveryFee: number;
  dellymanShopDeliveryDetails: IDeliveryDetails[];
  dellymanCompanyId?: number;
  success: boolean;
}> => {
  let totalDellymanDeliveryFee = 0;
  let success = true;
  let dellymanShopDeliveryDetails: IDeliveryDetails[] = [];
  let dellymanCompanyId;
  for (let shopId of shopIds) {
    const shop = shopOrderMapping[shopId as string];
    let deliveryCostPayload: DellymanGetQuotesPayload = {
      PaymentMode: "online",
      Vehicle: "Bike",
      IsInstantDelivery: 0,
      //PickupRequestedDate in this format 2022/11/12 with slashes in between the year, month and day instead of dashes
      PickupRequestedDate: new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "/"),
      PickupRequestedTime: "06 AM to 09 PM",
      PickupAddress: shop.address,
      DeliveryAddress: [receiversDetails.deliveryAddressDescription],
    };
    console.log("deliveryCostPayload", deliveryCostPayload);

    let response;
    try {
      response = await DellyDeliverymanService.getQuotes(deliveryCostPayload);
      dellymanCompanyId = response.Companies[0].CompanyID;
    } catch (error) {
      success = false;
    }
    console.log("response dhgdhdhhdhdhdh ddhdhhdhdhdhdhdhdh", response);
    console.log("success", success);

    if (success) {
      let deliveryCost = response.Companies[0].PayableAmount;
      console.log("delivery cost", deliveryCost);

      let shopDeliveryDetailPayload = {
        shop: shopId as string,
        deliveryCost: Number(deliveryCost),
        quantity: shopOrderMapping[shopId as string].quantity as number,
      };

      dellymanShopDeliveryDetails.push(shopDeliveryDetailPayload);
      totalDellymanDeliveryFee += Number(deliveryCost);
    }
  }

  return {
    totalDellymanDeliveryFee,
    dellymanShopDeliveryDetails,
    dellymanCompanyId,
    success,
  };
};
