// const mongoose = require("mongoose");
// const LoanEligibilitySettings = require("../../model/Loan/LoanEligibilitySettings.ts");
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
//   async LoanEligibilitySettings() {
//     return LoanEligibilitySettings.deleteMany({});
//   },
// };

// const seed = {
//   // Product seeder
//   async LoanEligibilitySettings() {
//     return LoanEligibilitySettings.insertMany([
//       {
//         title: "Tier 1",
//         key: "tier_1",
//         type: "account_tier",
//         value: -10,
//       },
//       {
//         title: "Tier 2",
//         key: "tier_2",
//         type: "account_tier",
//         value: 5,
//       },
//       {
//         title: "Tier 3",
//         key: "tier_3",
//         type: "account_tier",
//         value: 10,
//       },
//       {
//         title: "No Previous Defaults",
//         key: "no_previous_defaults",
//         type: "credit_history",
//         value: 10,
//       },
//       {
//         title: "One Previouse Default",
//         key: "one_previous_defaults",
//         type: "credit_history",
//         value: 10,
//       },
//       {
//         title: "Multiple Previouse Defaults",
//         key: "multiple_previous_defaults",
//         type: "credit_history",
//         value: 10,
//       },
//       {
//         title: "Previous Loan",
//         key: "previous_loan",
//         type: "additional_credit_history",
//         value: 0,
//       },
//       {
//         title: "One Loan",
//         key: "one_loan",
//         type: "additional_credit_history",
//         value: 5,
//       },
//       {
//         title: "Multiple Loan",
//         key: "multiple_loan",
//         type: "additional_credit_history",
//         value: 10,
//       },
//       {
//         title: "Permanent Employment",
//         key: "permanent_employment",
//         type: "employment_stability",
//         value: 10,
//       },
//       {
//         title: "Self Employed with stable income",
//         key: "self_employed_with_stable_income",
//         type: "employment_stability",
//         value: 5,
//       },
//       {
//         title: "Unstable Employment",
//         key: "unstable_employment",
//         type: "employment_stability",
//         value: -10,
//       },
//       {
//         title: "High income (above 500k)",
//         key: "high_income",
//         type: "employment_stability",
//         value: 10,
//       },
//       {
//         title: "Average income (above 200k - below 500",
//         key: "average_income",
//         type: "employment_stability",
//         value: 5,
//       },
//       {
//         title: "Low income ( below 200k)",
//         key: "low_income",
//         type: "employment_stability",
//         value: -10,
//       },
//       {
//         title: "Less than 36%",
//         key: "low_income",
//         type: "debt_to_income_ratio",
//         value: -10,
//       },
//       {
//         title: "36% - 50%",
//         key: "low_income",
//         type: "debt_to_income_ratio",
//         value: 5,
//       },
//       {
//         title: "More than 50%",
//         key: "low_income",
//         type: "debt_to_income_ratio",
//         value: -10,
//       },
//       {
//         title: "25 - 40 years",
//         key: "25_40_years",
//         type: "age",
//         value: 10,
//       },
//       {
//         title: "41 - 55 years",
//         key: "41_55_years",
//         type: "age",
//         value: -5,
//       },
//       {
//         title: "Below 25 years or Above 55 years",
//         key: "below_25_years_above_55_years",
//         type: "age",
//         value: -10,
//       },
//       {
//         title: "Regular payment",
//         key: "regular_payment",
//         type: "loan_repayment_history",
//         value: 10,
//       },
//       {
//         title: "Irregular payment",
//         key: "irregular_payment",
//         type: "loan_repayment_history",
//         value: -10,
//       },
//       {
//         title:
//           "Active (received credit for last 6 months) and healthy bank account",
//         key: "active_and_healthy_bank_account",
//         type: "bank_account_history",
//         value: 10,
//       },
//       {
//         title:
//           "Inactive or negative balance (more debits value than credit value over a 6 months period)",
//         key: "inactive_or_negative_balance",
//         type: "bank_account_history",
//         value: -10,
//       },
//     ]);
//   },
// };
// // node action
// const run = async function () {
//   // Start Connection
//   await connect();
//   // List models to drop
//   await drop.LoanEligibilitySettings();

//   // List models to seed
//   await seed.LoanEligibilitySettings();

//   // End Connection
//   await close();
//   console.log("successfully seeded data");
// };
// // run seeder
// run();
