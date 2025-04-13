import mongoose, { Schema } from "mongoose";
import LoanType from "./LoanType";
import LoanBioField from "./LoanBioField";

// const fieldSchema = new mongoose.Schema({
//   field: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: LoanBioField,
//   },
//   value: {
//     type: Schema.Types.Mixed,
//   },
// });

const loanBioSchema = new mongoose.Schema(
  {
    loanType: { type: mongoose.Schema.Types.ObjectId, ref: LoanType },
    // fields: [fieldSchema],
  },
  {
    timestamps: true,
    collection: "loan_bios",
  }
);

export default mongoose.model("loanbio", loanBioSchema);
