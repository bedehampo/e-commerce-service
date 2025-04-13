import cron from 'node-cron';
// import { User } from '../model/User';
import { Product } from '../model/shop/product';
import { Shop } from '../model/shop/shop';
import { CartItem } from '../model/shop/cartItem';
import config from '../config';


const lowStockThresholdCheck = `${config.env.isDevelopment ? '*' : 0} * * * *`; // Run every minute on development and every hour on production

const checkCartItemsReorderLevel = async () => {
    try {
        // const cartItems = await CartItem.find({}).populate('product');
        
        // for (let cartItem of cartItems) {
        //     const { product, quantity } = cartItem;

        //     if (product.stockQuantity < quantity) {
        //         // Product in the cart has gone below the reorder level
        //         const user = await User.findById(cartItem.user);
        //         const productName = product.productName;

        //         console.log(`Product ${productName} has gone below the reorder level for user ${user.email}`);

        //         const msg = `Product ${productName} is going out of stock, purchase on time before it goes out of stock`;
        //     }
        // }

        const allCartItems = await CartItem.find({}).populate('product');

        const cartItemsbyProduct = {};

        // console.log(allCartItems);

        // for (const cartItem in allCartItems) {
        //     const productId = cartItem.product._id;
        // }
    } catch (err) {
        console.error(`Error checking cart items reorder level: ${err.message}`);
    }
}

export default checkCartItemsReorderLevel;
