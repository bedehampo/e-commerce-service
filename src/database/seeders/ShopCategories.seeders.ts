// const mongoose = require("mongoose");
// const Category = require("../../model/admin/category.ts");
// const SubCategory = require("../../model/admin/subCategory.ts");

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
//   async Category() {
//     return Category.deleteMany({});
//   },
// };

// const seed = {
//   // Product seeder
//   async Category() {
//     const data = [
//       {
//         uuid: uuidv4(),
//         title: "Electronics",
//         subCategories: [
//           "Computers",
//           "Smartphones",
//           "Televisions",
//           "PC",
//           "Cameras",
//           "Headphones",
//           "Speakers",
//           "Camcoders",
//           "Wearables",
//           "Gaming",
//           "Others",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Fashion",
//         subCategories: [
//           "Clothing",
//           "Shoes",
//           "Accessories",
//           "Jewelry",
//           "Watches",
//           "Handbags",
//           "Wallets",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Home & Kitchen",
//         subCategories: [
//           "Furniture",
//           "Home Decor",
//           "Utensils",
//           "Cutlery",
//           "Beddings",
//           "Bath",
//           "Appliances",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Sports & Outdoors",
//         subCategories: [
//           "Exercise & Fitness",
//           "Outdoor Recreation",
//           "Sports Equipment",
//           "Cycling",
//           "Camping & Hiking",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Health & Personal Care",
//         subCategories: [
//           "Health Care",
//           "Personal Care",
//           "Beauty",
//           "Nutrition & Wellness",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Toys & Games",
//         subCategories: ["Toys", "Games & Puzzles", "Arts & Crafts"],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Books",
//         subCategories: [
//           "Fiction",
//           "Non-fiction",
//           "Children's Books",
//           "Cookbooks",
//           "Self-help",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Automotive",
//         subCategories: [
//           "Automotive Parts & Accessories",
//           "Car Electronics",
//           "Motorcycle & Powersports",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Pet Supplies",
//         subCategories: [
//           "Dog Supplies",
//           "Cat Supplies",
//           "Small Animal Supplies",
//           "Bird Supplies",
//           "Fish & Aquatic Pets",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Baby & Nursery",
//         subCategories: [
//           "Baby Gear",
//           "Diapering & Baby Care",
//           "Nursery Furniture & Decor",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Office Products",
//         subCategories: [
//           "Office Supplies",
//           "Office Electronics",
//           "Office Furniture",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Industrial & Scientific",
//         subCategories: [
//           "Lab & Scientific Products",
//           "Professional Medical Supplies",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Groceries & Gourmet Food",
//         subCategories: [
//           "Snack Foods",
//           "Breakfast Foods",
//           "Beverages",
//           "Cooking & Baking Supplies",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Electronics Accessories",
//         subCategories: [
//           "Cell Phone Accessories",
//           "Computer Accessories",
//           "Camera Accessories",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         title: "Handmade",
//         subCategories: [
//           "Handmade Jewelry",
//           "Handmade Clothing & Accessories",
//           "Handmade Home & Kitchen",
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     ];
//     for (const item of data) {
//       const subCategories = item.subCategories.map((subCategory) => {
//         return {
//           uuid: uuidv4(),
//           name: subCategory,
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         };
//       });

//       const subCategoriesAdded = await SubCategory.insertMany(subCategories);

//       const category = new Category({
//         uuid: item.uuid,
//         name: item.title,
//         subCategories: subCategoriesAdded.map((subCategory) => {
//           return subCategory._id;
//         }),
//         createdAt: item.createdAt,
//         updatedAt: item.updatedAt,
//       });

//       //update subcategories with category id
//       for (const subCategory of subCategoriesAdded) {
//         subCategory.categoryId = category._id;
//         await subCategory.save();
//       }

//       await category.save();
//     }
//   },
// };
// // node action
// const run = async function () {
//   // Start Connection
//   await connect();
//   // List models to drop
//   await drop.Category();

//   // List models to seed
//   await seed.Category();

//   // End Connection
//   await close();
//   console.log("successfully seeded data");
// };
// // run seeder
// run();
