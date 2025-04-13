// import { NextFunction, Request, Response } from "express";
// import { AdminUser } from "../../model/admin/adminUser";
// import { successResponse } from "../../helpers/index";
// import { ValidationError } from "../../errors";
// import { Faq } from "../../model/admin/faq";
// import { checkAdmin } from "../../services/checkAdmin";

// export const createFaq = async (
// 	req: any,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		// const currentUserId = req.user._id;

// 		// await checkAdmin(currentUserId);

// 		const { faqName, content } = req.body;
// 		if (!faqName || !content)
// 			throw new ValidationError("All fields are required");

// 		const lowerCaseName = faqName.toLowerCase();

// 		const doesFaqExist = await Faq.findOne({
// 			lowerCaseName,
// 		});

// 		if (doesFaqExist)
// 			throw new ValidationError("Name already exists");

// 		const faq = await Faq.create({
// 			faqName: lowerCaseName,
// 			content,
// 		});
// 		return res.send(
// 			successResponse(
// 				"Faq Tag Name created successfully",
// 				faq
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const updateFaq = async (
// 	req: any,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		// const currentUserId = req.user._id;

// 		// await checkAdmin(currentUserId);

// 		const { id } = req.params;
// 		const faq = await Faq.findById(id);

// 		if (!faq) {
// 			throw new ValidationError("Faq not found");
// 		}

// 		const { faqName, content } = req.body;

// 		if (!faqName || !content) {
// 			throw new ValidationError(
// 				"Both 'faqName' and 'content' are required"
// 			);
// 		}

// 		faq.faqName = faqName;
// 		faq.content = content;

// 		const updatedFaq = await faq.save();

// 		res.send(successResponse("Faq updated", updatedFaq));
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const deleteFaq = async (
// 	req: any,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		// const currentUserId = req.user._id;

// 		// await checkAdmin(currentUserId);

// 		const { id } = req.params;
// 		const faq = await Faq.findById(id);

// 		if (!faq) {
// 			throw new ValidationError("Faq not found");
// 		}
// 		const deletedFaq = await Faq.findByIdAndDelete(id);

// 		res.send(
// 			successResponse(
// 				"Faq deleted successfully",
// 				deletedFaq
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const getAllFaqs = async (
// 	req: any,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const faqs = await Faq.find({});

// 		res.send(
// 			successResponse("Faqs retrieved successfully", faqs)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const getSingleFaq = async (
// 	req: any,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		// const currentUserId = req.user._id;

// 		// await checkAdmin(currentUserId);

// 		const { id } = req.params;
// 		const faq = await Faq.findById(id);

// 		if (!faq) {
// 			throw new ValidationError("Faq not found");
// 		}
// 		const singleFaq = await Faq.findById(id);
// 		res.send(
// 			successResponse(
// 				"Faq retrieved successfully",
// 				singleFaq
// 			)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };

// export const getFaq = async (
// 	req: any,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const { faqName } = req.query;
// 		let faq;

// 		if (!faqName) {
// 			faq = await Faq.find().select(
// 				"-createdAt -updatedAt -__v -_id"
// 			);
// 		} else {
// 			faq = await Faq.findOne({ faqName }).select(
// 				"-createdAt -updatedAt -__v -_id"
// 			);
// 		}
// 		res.send(
// 			successResponse("Faq retrieved successfully", faq)
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// };
