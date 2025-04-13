import express from "express";
import validateResource from "../middlewares/validateResource";
import auth from "../middlewares/auth";
import {
	// abandonCartReminder,
	addToCart,
	clearCart,
	computeSelectedCartTotals,
	getCart,
	removeFromCart,
	updateCartItemQuantity,
} from "../controllers/cartController";
import {
	AddToCartSchema,
	ComputeSelectedCartTotalsSchema,
	RemoveFromCartSchema,
	UpdateCartQuantitySchema,
} from "../validation/cart.schema";

const router = express.Router();

router.get("/", auth, getCart);
router.post(
	"/compute_cart_total",
	auth,
	validateResource(ComputeSelectedCartTotalsSchema),
	computeSelectedCartTotals
);
router.post(
	"/",
	auth,
	validateResource(AddToCartSchema),
	addToCart
);

router.patch(
	"/update-quantity/:cartItemId",
	auth,
	validateResource(UpdateCartQuantitySchema),
	updateCartItemQuantity
);

router.delete("/clear", auth, clearCart);
router.delete(
	"/:cartItemId",
	auth,
	validateResource(RemoveFromCartSchema),
	removeFromCart
);

// abandoned cart
// router.get("/abandon", auth, abandonCartReminder);

export default router;
