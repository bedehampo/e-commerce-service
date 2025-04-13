// const mongoose = require("mongoose");
// const LoanDuration = require("../../model/Loan/LoanDuration.ts");
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
//   async LoanDuration() {
//     return LoanDuration.deleteMany({});
//   },
// };

// const seed = {
//   // Product seeder
//   async LoanDuration() {
//     return LoanDuration.insertMany([
//       {
//         uuid: uuidv4(),
//         value: 1,
//         unit: "month",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         value: 2,
//         unit: "month",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         value: 3,
//         unit: "month",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         value: 4,
//         unit: "month",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         value: 5,
//         unit: "month",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         value: 6,
//         unit: "month",
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
//   await drop.LoanDuration();

//   // List models to seed
//   await seed.LoanDuration();

//   // End Connection
//   await close();
//   console.log("successfully seeded data");
// };
// // run seeder
// run();
