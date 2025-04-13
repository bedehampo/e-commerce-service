// const mongoose = require("mongoose");
// const LoanCategory = require("../../model/Loan/LoanCategory.ts");
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
//   async LoanCategory() {
//     return LoanCategory.deleteMany({});
//   },
// };

// const seed = {
//   // Product seeder
//   async LoanCategory() {
//     return LoanCategory.insertMany([
//       {
//         title: "Rent",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         title: "Wedding",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         title: "Car",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         title: "School fee",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         title: "Side hustle",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         title: "Groceries",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         title: "Business",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         title: "Shopping",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         title: "Vacation",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         title: "Others",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     ]);
//   },
// };
// // node action
// const run = async function () {
//   // Start Connection
//   await connect();
//   // List models to drop
//   await drop.LoanCategory();

//   // List models to seed
//   await seed.LoanCategory();

//   // End Connection
//   await close();
//   console.log("successfully seeded data");
// };
// // run seeder
// run();
