import { getClientIp } from "@supercharge/request-ip";
import { NextFunction, Request, Response } from "express";
import { CustomRequest } from "../utils/interfaces";

export const getIpAndUserAgent = (req: any, res: any, next: any) => {
  try {
    // req.ip = getClientIp(req);
    req.userAgent = req.get("User-Agent");
    return next();
  } catch (error) {
    next(error);
  }
};

export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).send({
    status: "error",
    message: "endpoint not found",
  });
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
//  console.log(`res.headersSent: ${res.headersSent}`);
  // console.log(err.name);
  if (res.headersSent) {
    return next(err);
  }
  switch (err.name) {
    case "ServiceError":
      return res.status(400).send({
        status: "error",
        message: err.message,
      });
    case "NotFoundError":
      return res.status(404).send({
        status: "error",
        message: err.message,
      });
    case "ValidationError":
      return res.status(422).send({
        status: "error",
        message: err.message,
        // errors: err.errors,
      });
    case "AuthenticationError":
      return res.status(401).send({
        status: "error",
        message: err.message,
      });
    case "AuthorizationError":
      return res.status(403).send({
        status: "error",
        message: err.message,
      });
    case "ConflictError":
      return res.status(409).send({
        status: "error",
        message: err.message,
      });
    default:
      return res.status(500).send({
        status: "error",
        message: "an error occurred",
        ...(!err.message ? {} : { error: err.message || err.toString() }),
      });
  }
};
