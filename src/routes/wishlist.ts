import express from "express";
import auth from "../middlewares/auth";
import {
	getAllUserWishlists,
	addProductToWishlist,
	removeProductFromWishlist,
	relatedWishListProducts,
	getProductsIndividually,
} from "../controllers/wishListController";

const router = express.Router();

router.post("/:productId", auth, addProductToWishlist);
router.get("/", auth, getAllUserWishlists);
router.get("/products", auth, getProductsIndividually);
router.delete(
	"/:productId",
	auth,
	removeProductFromWishlist
);
router.get("/related", auth, relatedWishListProducts);

export default router;
