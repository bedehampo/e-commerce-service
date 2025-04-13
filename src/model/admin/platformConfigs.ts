import mongoose from "mongoose";

const platformConfigs = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    value: {
      type: String,
    },
    valueType: {
      type: String,
      required: true,
      enum: ["single", "array"],
    },
    description: {
      type: String,
    },
    values: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformConfig = mongoose.model(
  "platformconfigs",
  platformConfigs
);
