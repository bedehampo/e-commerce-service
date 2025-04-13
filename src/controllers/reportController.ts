import { NextFunction } from "express";
import { CustomRequest } from "../utils/interfaces";

export const reportController = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
	} catch (error) {
		next(error);
	}
};
