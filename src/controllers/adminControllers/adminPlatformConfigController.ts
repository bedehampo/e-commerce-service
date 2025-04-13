import { NextFunction, Response } from "express";
import { CustomRequest } from "../../utils/interfaces";
import { PlatformConfig } from "../../model/admin/platformConfigs";
import { successResponse } from "../../helpers";
import { AddPlatformConfigInput } from "../../validation/platformConfig.schema";

export const getPlatformConfigs = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const configs = await PlatformConfig.find();
    return res.send(
      successResponse("Platform configs fetched successfully", configs)
    );
  } catch (error) {
    next(error);
  }
};

export const addPlatformConfigs = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { key, value, valueType, description, values } =
      req.body as AddPlatformConfigInput["body"];

    const config = await PlatformConfig.create({
      key,
      value,
      valueType,
      description,
      values,
    });
    return res.send(
      successResponse("Platform config added successfully", config)
    );
  } catch (error) {
    next(error);
  }
};

export const updatePlatformConfigs = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const platformConfig = await PlatformConfig.findByIdAndUpdate(
      { _id: req.params.id },
      req.body
    );

    return res.send(
      successResponse("Platform config updated successfully", platformConfig)
    );
  } catch (error) {
    next(error);
  }
};
