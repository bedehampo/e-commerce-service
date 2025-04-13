import express from "express";
import auth from "../middlewares/auth";
import {
	createReport,
	getReportOptions,
	getSingleReportOption,
} from "../controllers/reportShopController";

const router = express.Router();

router.get("/", auth, getReportOptions);
router.get("/:id", auth, getSingleReportOption);
router.post("/", auth, createReport);


export default router;
