// import cron from "node-cron";
// import { User } from "../model/User";
// import { Product } from "../model/shop/product";
// import { Shop } from "../model/shop/shop";
// import config from "../config";
// import { sendMessage } from "../services/sendMessage";

// const lowStockThresholdCheck = `${config.env.isDevelopment ? '*' : 0} * * * *`; // Run every minute on development and every hour on production

// const scheduleLowStockThresholdCheck = () => {
//   cron.schedule(lowStockThresholdCheck, async () => {
//     try {
//      // Fetch the lowStockThreshold value frrom the Product schema or configuration
//         const lowStockProducts = await Product.aggregate([
//             {
//                 $match: {
//                     $expr: {
//                         $gt: ['lowStockThreshold', '$stockQuantity'],
//                     },
//                 },
//             },
//         ]);

//       for (let product of lowStockProducts) {
//         const shop = await Shop.findById(product.shop);
//         const shopOwner = await User.findById(shop.user);
//         const shopOwnerPhoneNumber = shopOwner.phoneNumber;

//         console.log(
//           `Low stock alert for product: ${product.productName}, current stock: ${product.stockQuantity}`
//         );
          
//         const msg = `Low stock alert for product: ${product.productName}, current 
//           stock: ${product.stockQuantity}`;

//           // TO DO:Send a push notification instead of SMS because of cost
//         //   await sendMessage(shopOwnerPhoneNumber.number, msg);
//       }

//       console.log("Low stock check complete");
//     } catch (err) {
//       console.error(`Error checking low stock: ${err.message}`);
//     }
//   });
// };

// export default scheduleLowStockThresholdCheck;
