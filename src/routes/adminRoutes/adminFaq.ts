// import express from "express";
// import { checkPermission } from "../../middlewares/checkPermission";
// import {
// 	createFaq,
// 	updateFaq,
// 	deleteFaq,
// 	getAllFaqs,
// 	getSingleFaq,
// 	getFaq,
// } from "../../controllers/adminControllers/adminFaqController";
// import { authenticateAdmin } from "../../middlewares/adminAuth";

// const router = express.Router();

// router.post(
// 	"/create-faq",
// 	// authenticateAdmin,
// 	// checkPermission("faq"),
// 	createFaq
// );

// router.patch(
// 	"/update-faq/:id",
// 	// authenticateAdmin,
// 	// checkPermission("faq"),
// 	updateFaq
// );

// router.delete(
// 	"/delete-faq/:id",
// 	// authenticateAdmin,
// 	// checkPermission("faq"),
// 	deleteFaq
// );

// router.get(
// 	"/get-all-faqs",
// 	getAllFaqs
// );

// router.get(
// 	"/get-single-faq/:id",
// 	// authenticateAdmin,
// 	// checkPermission("faq"),
// 	getSingleFaq
// );

// router.get("/get-faq", getFaq);

// export default router;
