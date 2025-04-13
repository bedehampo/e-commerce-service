// const mongoose = require("mongoose");
// const LoanBioField = require("../../model/Loan/LoanBioField.ts");
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
//   async LoanBioField() {
//     return LoanBioField.deleteMany({});
//   },
// };

// const seed = {
//   // Product seeder
//   async LoanBioField() {
//     return LoanBioField.insertMany([
//       {
//         uuid: uuidv4(),
//         title: "Loan Purpose",
//         key: "loan_purpose",
//         type: "select",
//         options: [
//           "Shopping",
//           "Vaction",
//           "Rent",
//           "Medical Bills",
//           "Car Purchase",
//           "School Fees",
//           "Renovations",
//           "Others",
//         ],
//       },
//       {
//         uuid: uuidv4(),
//         title: "Address",
//         key: "address",
//         type: "text",
//       },
//       {
//         uuid: uuidv4(),
//         title: "State",
//         key: "state",
//         type: "text",
//       },
//       {
//         uuid: uuidv4(),
//         title: "LGA",
//         key: "lga",
//         type: "text",
//       },
//       {
//         uuid: uuidv4(),
//         title: "Closest Landmark",
//         key: "closest_landmark",
//         type: "text",
//       },
//       {
//         uuid: uuidv4(),
//         title: "Next of Kin",
//         key: "next_of_kin",
//         type: "text",
//       },
//       {
//         uuid: uuidv4(),
//         title: "Education Level",
//         key: "education_level",
//         type: "select",
//         options: ["Primary", "Secondary", "Graduate", "Post Graduate", "HND"],
//       },
//       {
//         uuid: uuidv4(),
//         title: "Next of kin Phone number",
//         key: "next_of_kin_phone_number",
//         type: "text",
//       },
//       {
//         uuid: uuidv4(),
//         title: "Additional Account Details",
//         key: "additional_account_details",
//         type: "text",
//       },
//       {
//         uuid: uuidv4(),
//         title: "Industry",
//         key: "sector",
//         type: "select",
//         options: [
//           "Crop Production",
//           "Fishing",
//           "Poultry and Livestock",
//           "Plantation",
//         ],
//       },
//       {
//         uuid: uuidv4(),
//         title: "Date Joined",
//         key: "text",
//         type: "date",
//       },
//       {
//         uuid: uuidv4(),
//         title: "Sector",
//         key: "sector",
//         type: "select",
//         options: [
//           "Agriculture",
//           "Construction",
//           "Finance",
//           "Online",
//           "Human health and social work",
//           "Utilities",
//           "Education",
//           "NGO",
//           "Government",
//           "Manufacturing",
//           "Power and Energy",
//           "Waste Management",
//           "Administrative and support service",
//           "Real Estate Activities",
//         ],
//       },
//       {
//         uuid: uuidv4(),
//         title: "Company Name",
//         key: "company_name",
//         type: "text",
//       },
//       {
//         uuid: uuidv4(),
//         title: "Employment Status",
//         key: "employment_status",
//         type: "select",
//         options: ["employed", "self_employed"],
//       },
//       {
//         uuid: uuidv4(),
//         title: "Relationship",
//         key: "relationship",
//         type: "select",
//         options: ["Spouse", "Parent", "Sibling"],
//       },
//     ]);
//   },
// };
// // node action
// const run = async function () {
//   // Start Connection
//   await connect();
//   // List models to drop
//   await drop.LoanBioField();

//   // List models to seed
//   await seed.LoanBioField();

//   // End Connection
//   await close();
//   console.log("successfully seeded data");
// };
// // run seeder
// run();
