import { NextFunction } from "express";
import { CustomRequest, StatusTypes } from "../utils/interfaces";
import { checkUserById } from "./validators";
import { Shop } from "../model/shop/shop";
import { NotFoundError, ValidationError } from "../errors";
import { ShopMember } from "../model/shop/shopMembers";
import { ShopPermission } from "../model/shop/shopPermission";
import mongoose from "mongoose";
export const checkShopPermission = async (
  userId: number,
  shopId: string,
  permissionCode: string
): Promise<void> => {
  try {
    // console.log("hello", {
    //   _id: shopId,
    //   user: userId,
    //   status: StatusTypes.ACTIVE,
    // });

    // Check if the user is the shop owner
    const shop = await Shop.findOne({
      _id: shopId,
      user: userId,
      status: StatusTypes.ACTIVE,
    });

    // const shop = await Shop.findById(shopId)

    // console.log(shop);

    if (shop) {
      // console.log("hello");
      // User is the shop owner
      return;
    }

    // Check if the user is a shop member with the specified permission
    const permission = await ShopPermission.findOne({
      permissionCode: permissionCode.toLowerCase(),
    });

    if (!permission) {
      throw new NotFoundError(`${permissionCode} not found`);
    }
    // console.log("The permission", permission);
    const shopMember = await ShopMember.findOne({
      userId,
      shopId,
      status: "staff",
      // permissions: { $in: [permission._id] }, // Check if the user has the specific permission
    });

    if (!shopMember) {
      throw new NotFoundError(
        "An active shop member with the required permission not found"
      );
    }
    return;
  } catch (error) {
    throw error;
  }
};
