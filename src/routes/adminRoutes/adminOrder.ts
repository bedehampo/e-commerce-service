import express from "express";
import { authenticateAdmin } from "../../middlewares/adminAuthPV1";
import { updateOrder } from "../../controllers/adminControllers/adminOrdersController";

const router = express.Router();

router.get("/", (req, res) => {
	res.send("Admin Order Route");
});

router.patch("/:orderId", authenticateAdmin, updateOrder);

export default router;
