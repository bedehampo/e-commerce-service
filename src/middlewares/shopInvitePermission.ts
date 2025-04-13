// import { NotFound } from "@aws-sdk/client-s3";
// import { NextFunction, Request, Response } from "express";
// import { AuthorizationError, NotFoundError } from "../errors";
// import { User } from "../model/User";
// import { Shop } from "../model/shop/shop";
// import { ShopMember } from "../model/shop/shopMembers";
// import { ShopPermission } from "../model/shop/shopPermission";
// import { CustomRequest } from "../utils/interfaces";

// const checkShopInvitePermission = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { shopId, actionId } = req.body;
//   try {
//     // check invited user
//     const invitedUser = await User.findOne({ _id: req.user.id });

//     if (!invitedUser) {
//       throw new NotFoundError("User not found");
//     }

//     // check if valid action
//     const shopAction = await ShopPermission.findOne({ _id: actionId });
//     if (!shopAction) {
//       throw new NotFoundError("Invalid shop action specified");
//     }

//     // check if shop is valid and user is shop owner
//     const shop = await Shop.findOne({ _id: shopId });
//     if (!shop) {
//       throw new NotFoundError("Shop not found");
//     }

//     // check if member is invited to shop
//     // if (!shop.shopMembers.includes(req.user.id)) {
//     //   throw new AuthorizationError(
//     //     "You have not been invited to manage this shop"
//     //   );
//     // } else {
//     //   // member is invited, check status
//     //   const shopMember = await ShopMember.findOne({
//     //     userId: req.user.id,
//     //     shopId,
//     //   });

//     //     // Check if shop member exists
//     //   if (!shopMember) {
//     //     throw new NotFoundError("Shop member not found");
//     //   }

//     //     // Membership exists, check if active
//     //   if (shopMember.status !== "active") {
//     //     throw new AuthorizationError("You are not an active member of this shop");
//     //   }
        
//     //   // shop Member is active, check permissions
//     //     if (!shopMember.permissions.includes(actionId)) {
//     //         throw new AuthorizationError('');
//     //     } else {
//     //         next();
//     //     }
//     // }

//     // if (!shop.shopMembers.includes(req.user.id)) {
//     //   throw new AuthorizationError(
//     //     "You have not been invited to manage this shop"
//     //   );
//     // } else if (!shop.shopMembers.includes(actionId)) {
//     //   throw new AuthorizationError(
//     //     "You are not authorized to perform this action"
//     //   );
//     // } else if (shop.user.toString() !== req.user.id) {
//     //   throw new AuthorizationError("You are not the shop owner");
//     // } else {
//     //   throw new AuthorizationError(
//     //     `You are not authorized to ${shopAction.permissionDescription}`
//     //   );
//     // }
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// };
