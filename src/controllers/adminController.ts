// import express, { NextFunction, Response } from "express";
// import { User } from "../model/User";
// import { random, authentication, successResponse } from "../helpers/index";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import { CustomRequest } from "../utils/interfaces";

// // Get all users locked funds

// // export const registerAdmin = async (
// // 	req: express.Request,
// // 	res: express.Response
// // ) => {
// // 	try {
// // 		// Administrative User model
// // 		const { phoneNumber, password, role } = req.body;
// // 		// checking for superuser
// // 		const superUserExists = await User.findOne({ role: "superuser" });
// // 		if (superUserExists) {
// // 			return res
// // 				.status(400)
// // 				.json({ error: "Only a single superuser permitted" });
// // 		}

// // 		// validation registration fields
// // 		if (!phoneNumber || !password || !role) {
// // 			return res.status(400).json({ error: "All fields are mandatory" });
// // 		}
// // 		// checking existing user
// // 		const existingUser = await getUserByPhoneNumber(phoneNumber);
// // 		if (existingUser) {
// // 			return res.status(400).json({ error: "users already existing" });
// // 		}
// // 		// secured the password
// // 		const saltRounds = 10;
// // 		const hashPassword = await bcrypt.hash(password, saltRounds);

// // 		let user = new User({
// // 			phoneNumber,
// // 			password: hashPassword,
// // 		});

// // 		user = await user.save();
// // 		return res.status(201).json(user);
// // 	} catch (error) {
// // 		console.log(error);
// // 		return res.status(400).json({ error: "Server error" });
// // 	}
// // };

// // 

// export const getUsers = async (req: CustomRequest, res: Response, next: NextFunction) => {
//     try {
//         const users = await User.find({});
//         return res.send(successResponse('Users fetched successfully!', users));
//     } catch (err) {
//         console.error(err);
//         next(err);
//     }
// }