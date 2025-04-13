import mongoose, { Schema } from "mongoose";
// const mongoose = require("mongoose");

const loanCategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "loan_categories",
  }
);

export default mongoose.model("loanCategories", loanCategorySchema);
// module.exports = mongoose.model("loanCategories", loanCategorySchema);
