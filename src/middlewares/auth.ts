import RequestIp from "@supercharge/request-ip";
import axios, { AxiosRequestConfig } from "axios";
import express, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config/index";
import { AuthenticationError } from "../errors";
import { axiosConfig } from "../utils/global";
import { CustomRequest } from "../utils/interfaces";
import UserService from "../lib/userService";
import TransactionService from "../lib/transactionService";

const auth = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    // req.user = req.user || {
    //   id: "",
    // };
    const authorization = req.header("authorization") || "";
    const token = authorization.split(" ")[1];
    if (!token) {
      return next(new AuthenticationError("No token, authorization denied"));
    }
    // console.log(token);
    UserService.setToken(token);
    TransactionService.setToken(token);
    const response = await UserService.getUser();
  
    const user = {
      id: response.id,
      phoneNumber: response.mobileNumber,
    };

    req.user = user;
    req.userService = UserService;
    req.transactionService = TransactionService

    next();
  } catch (error: any) {
    console.log(error.response.data);

    // console.error(error);
    // switch (error.name) {
    //   case "TokenExpiredError":
    //     return next(new AuthenticationError("Invalid or expired token"));
    //   case "JsonWebTokenError":
    //     return next(new AuthenticationError("Invalid or expired token"));
    //   case "NotBeforeError":
    //     return next(new AuthenticationError("Invalid or expired token"));
    //   default:
    //     return next(error);
    // }
    return res.send(error.response.data);
  }
};

export default auth;

// get-user-profile-by-id
// get-user-shop-by-id
// get-user-spend-limit-by-id
