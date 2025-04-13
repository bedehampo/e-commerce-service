// import bcrypt from "bcrypt";
// import { NextFunction, Request, Response } from "express";
// import jwt from "jsonwebtoken";
// import {
// 	AuthenticationError,
// 	AuthorizationError,
// 	NotFoundError,
// 	ValidationError,
// } from "../../errors";
// import { successResponse } from "../../helpers/index";
// import { CustomRequest } from "../../utils/interfaces";
// import { AdminUser } from "../../model/admin/adminUser";

// export const adminLogin = async (
// 	req: CustomRequest,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		let { email, password } = req.body;
// 		if (!email || !password)
// 			throw new ValidationError("All fields are required");

// 		const adminUser = await AdminUser.findOne({
// 			email,
// 			emailverified: true,
// 			status: "verified",
// 		});
// 		if (!adminUser)
// 			throw new NotFoundError("User not found");


// 		// verify the password
// 		const matchPassword = await bcrypt.compare(
// 			password,
// 			adminUser.password
// 		);
// 		if (!matchPassword) {
// 			throw new AuthenticationError("Invalid credentials");
// 		}

// 		const token = jwt.sign(
// 			{
// 				_id: adminUser._id,
// 				email: adminUser.email,
// 			},
// 			process.env.JWT_SECRET,
// 			{
// 				expiresIn: "10h",
// 			}
// 		);

// 		return res.send(
// 			successResponse("Login successful", {
// 				token,
// 			})
// 		);
// 	} catch (err) {
// 		console.log(err);
// 		next(err);
// 	}
// };
