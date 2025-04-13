import mongoose, { Schema } from "mongoose";

const employmentSectorSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "employment_sector",
  }
);

export default mongoose.model("employment_sector", employmentSectorSchema);
