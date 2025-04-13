// const mongoose = require("mongoose");
// const LoanType = require("../../model/Loan/LoanType.ts");
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
//   async LoanType() {
//     return LoanType.deleteMany({});
//   },
// };

// const seed = {
//   // Product seeder
//   async LoanType() {
//     return LoanType.insertMany([
//       {
//         uuid: uuidv4(),
//         name: "personal",
//         interestRate: 0.05,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         name: "nano",
//         interestRate: 0.1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         uuid: uuidv4(),
//         name: "sme",
//         interestRate: 0.15,
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
//   await drop.LoanType();

//   // List models to seed
//   await seed.LoanType();

//   // End Connection
//   await close();
//   console.log("successfully seeded data");
// };
// // run seeder
// run();
