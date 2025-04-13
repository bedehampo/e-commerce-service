// const mongoose = require("mongoose");
// const Shop = require("../../model/shop/shop.ts");
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
//   async Shop() {
//     return Shop.deleteMany({});
//   },
// };

// const seed = {
//   // Product seeder
//   async Shop() {
//     return Shop.insertMany([]);
//   },
// };
// // node action
// const run = async function () {
//   // Start Connection
//   await connect();
//   // List models to drop
//   await drop.Shop();

//   // List models to seed
//   await seed.Shop();

//   // End Connection
//   await close();
//   console.log("successfully seeded data");
// };
// // run seeder
// run();
