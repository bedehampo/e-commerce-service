import mongoose from "mongoose";
import { NotFoundError, ServiceError } from "../../errors";
import { TransactionService } from "../../lib/transactionService";
import { UserService } from "../../lib/userService";
import { checkUserById } from "../../middlewares/validators";
import { DealDeliveryPrices } from "../../model/shop/DealDeliveryPrices";
import { Deal } from "../../model/shop/deal";
import {
  DealPaymentStatus,
  DealRequest,
  DealRequestStatus,
} from "../../model/shop/dealRequest";
import { DeliveryMerchant } from "../../model/shop/deliveryMerchant";
import { DeliveryCompanies, TransactionDetailsItem } from "../../types/order";
import { TransactionStatusCode } from "../../types/transactions";
import { generateTransactionReference } from "../../utils/global";
import { InitiateDealPaymentInput } from "../../validation/deal.schema";

const initiateDealPayment = async (
  params: InitiateDealPaymentInput["body"],
  userId: number,
  session: any,
  userService: UserService,
  transactionService: TransactionService
) => {
  const user = await checkUserById(userId, userService);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const { deliveryDetailsId, dealRequestId, deliveryMerchant } = params;

  const dealRequest = await DealRequest.findById(dealRequestId);

  //check if deal request exists
  if (!dealRequest) {
    throw new NotFoundError("Deal request not found");
  }

  //check if user is the owner of the deal request
  if (dealRequest.userId !== userId) {
    throw new ServiceError("You are not authorized to perform this operation");
  }

  //check if deal request has been accepted by the dealer
  if (dealRequest.status !== DealRequestStatus.Ongoing) {
    throw new ServiceError("Deal request has not been accepted");
  }

  //check if deal request has been paid for
  if (dealRequest.paymentStatus === DealPaymentStatus.PAID) {
    throw new ServiceError("Deal has already been paid for");
  }
  const deal = await Deal.findById(dealRequest.dealId);

  const dealer = await userService.getUserById(deal.userId);

  const deliveryMerchantDetails = await DeliveryMerchant.findById(
    deliveryMerchant
  );
  if (!deliveryMerchantDetails) {
    throw new NotFoundError("Delivery merchant not found");
  }

  const dealdeliveryprices = await DealDeliveryPrices.findById(
    deliveryDetailsId
  );

  if (!dealdeliveryprices) {
    throw new NotFoundError("Deal delivery details not found");
  }

  let merchantNameMapping = {
    [DeliveryCompanies.Gig]: "gig",
    [DeliveryCompanies.Kwik]: "kwik",
  };
  interface IDeliveryDetails {
    dealer: string;
    deliveryCost: number;
    quantity: number;
    // deliveryMerchant?: string;
  }
  const deliveryDetails: {
    price: number;
    merchantId: string;
    deliveryDetails: IDeliveryDetails[];
  } = dealdeliveryprices[merchantNameMapping[deliveryMerchantDetails.name]];
  let totalDeliveryFee = deliveryDetails.price;
  const transactionReference = generateTransactionReference(10);
  const items: TransactionDetailsItem[] = [];

  const transactionItem: TransactionDetailsItem = {
    parentRef: transactionReference,
    amount: dealRequest.amount,
    accountNo: user.accountNumber,

    shopName: dealer.firstName + " " + dealer.lastName,

    itemName: deal.productName,

    quantity: dealRequest.quantity,
  };
  items.push(transactionItem);

  const response = await transactionService.initiateTransaction({
    transactionType: "PURCHASE",
    transactionDetailsDto: {
      fee: totalDeliveryFee,
      transactionRef: transactionReference,
      description: "Single deal purchase",
      // customerUniqueIdentifier: user.id,
      items: items,
    },
  });
  if (response.code !== TransactionStatusCode.SUCCESSFUL) {
    throw new ServiceError(response.description);
  }

  // let paymentInfo = {
  //   transactionReference,
  //   paymentStatus: DealPaymentStatus.INITIATED,
  //   totalAmountWithDelivery: dealRequest.amount + totalDeliveryFee,
  // };
  dealRequest.transactionReference = transactionReference;
  dealRequest.paymentStatus = DealPaymentStatus.INITIATED;
  dealRequest.totalAmountWithDelivery = dealRequest.amount + totalDeliveryFee;
  dealRequest.deliveryMerchant = new mongoose.Types.ObjectId(deliveryMerchant);
  dealRequest.save({ session });

  await session.commitTransaction();
  session.endSession();
  return {
    transactionReference,
    total: dealRequest.amount + totalDeliveryFee,
  };
};

export default initiateDealPayment;
