import { NextFunction, Request, Response } from "express";

const budpayTestSecretKey = process.env.BUDPAY_TEST_SECRET_KEY;

const setBearerToken = (req: Request, res: Response, next: NextFunction) => {
	req.headers.authorization = `Bearer ${budpayTestSecretKey}`;
	req.headers["content-type"] = "application/json";
	next();
};

export default setBearerToken;
