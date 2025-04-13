import { UserService } from "../../lib/userService";
import { checkUserById } from "../../middlewares/validators";
import { Deal } from "../../model/shop/deal";
import {
  DeliveryCompanies,
  KwikCalculatePricePayload,
  KwikStatusCode,
} from "../../types/order";
import { CalculateDeliveryInput } from "../../validation/deal.schema";
import KwikDeliveryService from "../../lib/kwik";
import { DeliveryMerchant } from "../../model/shop/deliveryMerchant";
import GigService from "../../lib/gig";
import { IDeal } from "../../types/deal";
import { IUser } from "../../types/user";
import { DealRequest, DealRequestStatus } from "../../model/shop/dealRequest";
import { DealDeliveryPrices } from "../../model/shop/DealDeliveryPrices";
import { ServiceError } from "../../errors";

const calculateDealDeliveryPrices = async (
  params: CalculateDeliveryInput["body"],
  userId: number,
  session: any,
  userService: UserService
) => {
  const {
    receiversName,
    receiversPhoneNumber,
    deliveryAddress,
    deliveryAddressDescription,
    dealRequestId,
  } = params;

  const user = await checkUserById(userId, userService);
  const dealRequest = await DealRequest.findById(dealRequestId);
  console.log("dealRequest", dealRequest);

  const deal = await Deal.findById(dealRequest.dealId);

  //check if deal request has been accepted by the dealer
  if (dealRequest.status !== DealRequestStatus.Ongoing) {
    throw new ServiceError("Deal request has not been accepted");
  }

  // const authResponse = await GigService.login();

  // let deliveryCostPayload = {
  //   SenderAddress: deal.address,
  //   SenderName: user.firstName,
  //   ReceiverName: receiversName,
  //   ReceiverAddress: deliveryAddressDescription,
  //   ReceiverPhoneNumber: receiversPhoneNumber,
  //   VehicleType: "BIKE",
  //   SenderPhoneNumber: user.mobileNumber,
  //   ReceiverStationId: "4",
  //   SenderStationId: "4",
  //   UserId: authResponse.UserId,
  //   ReceiverLocation: {
  //     Latitude: deliveryAddress.latitude.toString(),
  //     Longitude: deliveryAddress.longitude.toString(),
  //     // Latitude: "6.56947",
  //     // Longitude: "3.3883414",
  //   },
  //   SenderLocation: {
  //     Latitude: deal.location.coordinates[1].toString(),
  //     Longitude: deal.location.coordinates[0].toString(),
  //     // Latitude: "6.459183655304364",
  //     // Longitude: "3.4494126947893187",
  //   },
  //   PreShipmentItems: [
  //     {
  //       ItemName: "jhhh",
  //       Quantity: dealRequest.quantity.toString(),
  //       ItemType: "Normal",
  //       ShipmentType: "Regular",
  //     },
  //   ],
  // };
  // // calculateDeliveryCostPayloadStore.push(deliveryCostPayload);
  // GigService.setToken(authResponse.access_token);
  // let deliveryCost = await GigService.calculateShipmentPrice(
  //   deliveryCostPayload
  // );
  // // console.log("delivery cost", deliveryCost);

  // let totalGigDeliveryFee = Number(deliveryCost);

  // let gigDealDeliveryDetails = {
  //   dealer: deal.userId,
  //   deliveryCost: deliveryCost,
  //   quantity: dealRequest.quantity,
  // };

  let receiversDetails = {
    receiversName,
    receiversPhoneNumber,
    deliveryAddress,
    deliveryAddressDescription,
  };

  const kwikResponse = await kwikDeliveryCalculation(
    dealRequest.dealId.toString(),
    receiversDetails,
    deal.quantity,
    userService
  );

  let { kwikDeliveryCost, kwikDeliveryDetail } = kwikResponse;

  // const gigMerchant = await DeliveryMerchant.findOne({
  //   name: DeliveryCompanies.Gig,
  // });

  const kwikMerchant = await DeliveryMerchant.findOne({
    name: DeliveryCompanies.Kwik,
  });

  const dealDeliveryPrices = new DealDeliveryPrices({
    receiversName,
    receiversPhoneNumber,
    deliveryAddress,
    deliveryAddressDescription,
    // gig: {
    //   price: totalGigDeliveryFee,
    //   merchantId: gigMerchant._id,
    //   deliveryDetails: gigDealDeliveryDetails,
    // },
    kwik: {
      price: kwikDeliveryCost,
      merchantId: kwikMerchant._id,
      deliveryDetails: kwikDeliveryDetail,
    },
  });

  dealDeliveryPrices.save({ session });
  await session.commitTransaction();
  session.endSession();
  return {
    deliveryAddressDescription,
    id: dealDeliveryPrices._id,
    pickUpAddress: deal.address,
    deliveryCompanies: [
      // {
      //   name: DeliveryCompanies.Gig,
      //   price: totalGigDeliveryFee,
      //   imageUrl:
      //     "https://upload.wikimedia.org/wikipedia/en/c/ce/GIG_Logistics_logo.png",
      //   merchantId: gigMerchant._id,
      // },
      {
        name: DeliveryCompanies.Kwik,
        price: kwikDeliveryCost,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/en/c/ce/GIG_Logistics_logo.png",
        merchantId: kwikMerchant._id,
      },
    ],
  };
};

export default calculateDealDeliveryPrices;

const kwikDeliveryCalculation = async (
  dealId: string,
  receiversDetails: {
    receiversName: string;
    receiversPhoneNumber: string;
    deliveryAddress: {
      latitude?: number;
      longitude?: number;
    };
    deliveryAddressDescription: string;
  },
  quantity: number,
  userService: UserService
) => {
  const authResponse = await KwikDeliveryService.login();

  let accessToken = authResponse.access_token;
  let vendorId = authResponse.vendor_details.vendor_id;

  const deal = (await Deal.findById(dealId)) as IDeal<number>;
  const user = await userService.getUserById(deal.userId);
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
        address: deal.address,
        name: user.firstName,
        latitude: deal.location.coordinates[1],
        longitude: deal.location.coordinates[0],
        // latitude: config.env.isDevelopment
        //   ? 30.7188978
        //   : shop.location.coordinates[1],
        // longitude: config.env.isDevelopment
        //   ? 76.8794589
        //   : shop.location.coordinates[0],
        phone: user.mobileNumber,
        //@ts-ignore
        email: user.email,
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

  let response = await KwikDeliveryService.calculateShipmentPrice(
    deliveryCostPayload
  );

  if (response.status !== KwikStatusCode.ACTION_COMPLETE) {
    throw new ServiceError(response.message);
  }

  let deliveryCost = Number(response.data.per_task_cost);
  // console.log("delivery cost", deliveryCost);

  let deliveryDetail: IDealDeliveryDetails = {
    dealer: deal.userId,
    deliveryCost: Number(deliveryCost),
    quantity: quantity as number,
  };

  return { kwikDeliveryCost: deliveryCost, kwikDeliveryDetail: deliveryDetail };
};

interface IDealDeliveryDetails {
  dealer: number;
  deliveryCost: number;
  quantity: number;
  // deliveryMerchant?: string;
}
