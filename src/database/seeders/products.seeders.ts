// const mongoose = require("mongoose");
// const Product = require("../../model/Shop/product.ts");
// const Category = require("../../model/admin/category.ts");
// const SubCategory = require("../../model/admin/subCategory.ts");
// const Shop = require("../../model/Shop/shop.ts");
// const { faker } = require("@faker-js/faker");
// require("dotenv").config();
// const { v4: uuidv4 } = require("uuid");

// // connect to mongo db
// const mongoUri = process.env.MONGO_URI;
// const connect = async () => {
//   mongoose.connect(mongoUri, { keepAlive: true });
//   mongoose.connection.on("error", (error) => {
//     console.log(error);
//     throw new Error(`unable to connect to database: ${mongoUri}`);
//   });
// };
// // End mongo DB connection
// const close = function () {
//   return new Promise((resolve) => {
//     mongoose.connection.close();
//   });
// };

// // Drop tables
// const drop = {
//   // List the models to drop
//   async Product() {
//     return Product.deleteMany({});
//   },
// };

// const seed = {
//   // Product seeder
//   async Product() {
//     const shops = await Shop.find({});
//     // console.log(shops);

//     //create 100 random products for each shop
//     for (let i = 0; i < shops.length; i++) {
//       let shop = shops[i];
//       let shopCategory = await Category.findOne({
//         _id: shop.category,
//       }).populate("subCategories");

//       console.log(shopCategory);

//       //random sub category

//       let randomSubCategory =
//         shopCategory.subCategories[
//           Math.floor(Math.random() * shopCategory.subCategories.length)
//         ];

//       //create 100 random products for each shop

//       let products = [];
//       for (let j = 0; j < 50; j++) {
//         let product = {
//           productName: faker.commerce.productName(),
//           productDescription: faker.commerce.productDescription(),
//           productPrice: faker.number.int({
//             min: 4000,
//             max: 50000,
//           }),
//           discountAmount: faker.number.int({ max: 1000, min: 0 }),

//           productCategory: randomSubCategory._id,
//           productShopCategory: shopCategory._id,
//           shop: shop._id,
//           productImage: [
//             faker.image.url({
//               width: 600,
//               height: 600,
//               keyword: "product",
//             }),
//             faker.image.url({
//               width: 600,
//               height: 600,
//               keyword: "product",
//             }),
//             faker.image.url({
//               width: 600,
//               height: 600,
//               keyword: "product",
//             }),
//             faker.image.url({
//               width: 600,
//               height: 600,
//               keyword: "product",
//             }),
//             faker.image.url({
//               width: 600,
//               height: 600,
//               keyword: "product",
//             }),
//           ],
//           negotiable: faker.datatype.boolean(),

//           stockQuantity: faker.number.int({ max: 1000, min: 0 }),
//           customFields: [
//             {
//               title: faker.commerce.productMaterial(),
//               value: faker.commerce.productMaterial(),
//             },
//             {
//               title: faker.commerce.productMaterial(),
//               value: faker.commerce.productMaterial(),
//             },
//           ],
//         };

//         products.push(product);
//       }

//       console.log(products);

//       await Product.insertMany(products);
//     }

//     // const dummyData = [
//     //   {
//     //     productName: "Iphone 13 pro max",
//     //     productDescription:
//     //       "Luxury phone, 6.5 inches, 3 cameras, tunnel vision, sharingan, money printing, cures diseases, ends world hunger, rewrites reality",
//     //     productPrice: 500000,
//     //     productCategory: "64faf3f20dec80301f761fa1",
//     //     shop: "64faf447f9edcd69b841fd19",
//     //     productShopCategory: "64faf3f20dec80301f761fac",
//     //     // shop_list: "Iphone",
//     //     negotiable: false,
//     //     productQuantity: 90,
//     //     customFields: [
//     //       {
//     //         title: "Brand",
//     //         value: "Apple",
//     //       },
//     //       {
//     //         title: "Inches",
//     //         value: "6.5",
//     //       },
//     //     ],
//     //     // hashtags: ["iphone", "apple", "phone", "pro max"],
//     //   },
//     //   {
//     //     productName: "Samsung flat screen tv",
//     //     productDescription:
//     //       "48 inches samsing flat screen, HD, 3D virtual reality, destiny viewing, time travel, teleportation, witchcraft",
//     //     productPrice: 450000,
//     //     productCategory: "64faf3f20dec80301f761fa2",
//     //     productShopCategory: "64faf3f20dec80301f761fac",
//     //     shop: "64faf447f9edcd69b841fd19",
//     //     // shop_list: "HP",
//     //     negotiable: false,
//     //     productQuantity: 90,
//     //     customFields: [
//     //       {
//     //         title: "Brand",
//     //         value: "Samsung",
//     //       },
//     //       {
//     //         title: "Inches",
//     //         value: "48",
//     //       },
//     //     ],
//     //     // hashtags: ["samsung", "flat screen", "HD", "destiny viewing"],
//     //   },
//     //   {
//     //     productName: "HP envy x360 ",
//     //     productDescription:
//     //       "A nice laptop amd ryzen 7 radeon vega graphics card",
//     //     productPrice: 3000,
//     //     productCategory: "64faf3f20dec80301f761fa0",
//     //     shop: "64faf447f9edcd69b841fd19",
//     //     productShopCategory: "64faf3f20dec80301f761fac",
//     //     // shop_list: "HP",
//     //     negotiable: false,
//     //     productQuantity: 90,
//     //     customFields: [
//     //       {
//     //         title: "Brand",
//     //         value: "HP",
//     //       },
//     //       {
//     //         title: "Processor",
//     //         value: "AMD ryzen 7",
//     //       },
//     //     ],
//     //     // hashtags: ["hp", "hp envy", "laptop", "amd"],
//     //   },
//     //   {
//     //     productName: "Delux Burger",
//     //     productDescription: "Chop life cheee cheee burger ",
//     //     productPrice: 3000,
//     //     productCategory: "64faf3f60dec80301f761fff",
//     //     productShopCategory: "64faf3f60dec80301f762004",
//     //     shop: "64faf513826459322ac0127a",
//     //     // shop_list: "burger",
//     //     negotiable: false,
//     //     productQuantity: 30,
//     //     customFields: [
//     //       {
//     //         title: "Bacon",
//     //         value: "1 portion",
//     //       },
//     //       {
//     //         title: "Chees",
//     //         value: "2 portions",
//     //       },
//     //     ],
//     //     // hashtags: ["burger", "chop life", "snacks", "cheese"],
//     //   },
//     //   {
//     //     productName: "Big boy Rice and Chicken",
//     //     productDescription:
//     //       "Chop life cheee cheee rice and chicken with salad and a drink ",
//     //     productPrice: 6000,
//     //     productCategory: "64deb723a394257e6b8b8bdf",
//     //     productShopCategory: "64faf3f60dec80301f762004",
//     //     shop: "64faf513826459322ac0127a",
//     //     // shop_list: "combo",
//     //     negotiable: false,
//     //     customFields: [
//     //       {
//     //         title: "Salad",
//     //         value: "1 portion",
//     //       },
//     //       {
//     //         title: "Chicken type",
//     //         value: "Roasted",
//     //       },
//     //       {
//     //         title: "Chicken pieces",
//     //         value: "2",
//     //       },
//     //     ],
//     //     productQuantity: 90,
//     //     // hashtags: ["chicken", "mr biggs", "chop life", "rice"],
//     //   },
//     // ];

//     // console.log(dummyData);

//     // return Product.insertMany(dummyData);
//     // const shops = ["64d36bdcb0bb8f2d488b90e7", "64d3e96a09a533753fa74be7"];
//     // const randomShop = shops[Math.floor(Math.random() * shops.length)];
//     // const products = [];
//     // for (let i = 0; i < 100; i++) {
//     //   products.push({
//     //     name: `Product ${i}`,
//     //     description: `Description ${i}`,
//     //     price: 1000,
//     //     shop: randomShop,
//     //     createdAt: new Date(),
//     //     updatedAt: new Date(),
//     //   });
//     // }
//     // return Product.insertMany([]);
//   },
// };
// // node action
// const run = async function () {
//   // Start Connection
//   await connect();
//   // List models to drop
//   await drop.Product();

//   // List models to seed
//   await seed.Product();

//   // End Connection
//   await close();
//   console.log("successfully seeded data");
// };
// // run seeder
// run();
