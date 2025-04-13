import { NotFoundError, ServiceError } from "../../errors";
import { TransactionService } from "../../lib/transactionService";
import { UserService } from "../../lib/userService";
import { checkUserById } from "../../middlewares/validators";
import { DealPaymentStatus, DealRequest } from "../../model/shop/dealRequest";
import { TransactionStatusCode } from "../../types/transactions";

const completeDealPayment = async (
  transactionReference: string,
  userId,
  pin,
  session: any,
  userService: UserService,
  transactionService: TransactionService
) => {
  const user = await checkUserById(userId, userService);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const dealRequest = await DealRequest.findOne({
    transactionReference,
  });

  if (!dealRequest) {
    throw new NotFoundError("Deal request not found");
  }

  //check if user is the owner of the deal request
  if (dealRequest.userId !== userId) {
    throw new ServiceError("You are not authorized to perform this operation");
  }


  let response;

  response = await transactionService.completeTransaction(
    pin,
    transactionReference,
    dealRequest.deliveryMerchant.toString()
  );

  if (response.code !== TransactionStatusCode.SUCCESSFUL) {
    throw new ServiceError(response.description);
  }

  dealRequest.paymentStatus = DealPaymentStatus.PAID;
  await dealRequest.save({ session });

  await session.commitTransaction();
  session.endSession();

  return dealRequest;
};

export default completeDealPayment;
