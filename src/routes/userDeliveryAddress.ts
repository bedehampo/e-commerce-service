import express from "express";
import auth from "../middlewares/auth";
import {
	saveUserDeliveryAddress,
	updateDeliveryAddress,
	getDeliverySavedAddresses,
	getSingleSavedAddress,
	deleteAddress,
} from "../controllers/userDeliveryAddressController";
const router = express.Router();

router.post("/", auth, saveUserDeliveryAddress);
router.patch("/update/:id", auth, updateDeliveryAddress);
router.get("/", auth, getDeliverySavedAddresses);
router.get("/single/:id", auth, getSingleSavedAddress);
router.delete("/:id", auth, deleteAddress);

export default router;
