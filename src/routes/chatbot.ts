import express from "express";
import auth from "../middlewares/auth";
import {
	askMotoPay,
	getChatBotHistory,
} from "../controllers/chatBotController";
const router = express.Router();

router.post("/ask-motopay", auth, askMotoPay);
router.get("/get-history", auth, getChatBotHistory);

export default router;
