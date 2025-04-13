import { NextFunction, Response } from "express";
import { AdminRequest, CustomRequest } from "../utils/interfaces";
import { AdminRole } from "../model/admin/adminRole";
import { ValidationError } from "../errors";
import { AdminUser } from "../model/admin/adminUser";
import { AdminPermission } from "../model/admin/adminPermission";

export const checkPermission = (permissionName: string) => {
  return async (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
      // const adminUser = req.adminUser;
      // const adminService = req.AdminService;

      // const response = await adminService.checkPermission(permissionName);
      // // console.log(response);

      next();
    } catch (error) {
      return res.send(error.response.data);
    }
  };
};
