import { string } from "joi";
import mongoose, { Schema } from "mongoose";
import config from "../config";
import { FlagTypes } from "../utils/interfaces";

const TermsOfServiceSchema: Schema = new Schema(
  {
    heading: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["published", "stale"],
      default: "published",
    },
  },
  {
    timestamps: true,
    collection: "terms_of_service",
  }
);

// Apply a unique compound index on heading and body
TermsOfServiceSchema.index({ heading: 1, body: 1 }, { unique: true });

export const TermsOfService = mongoose.model(
  "termsOfService",
  TermsOfServiceSchema
);
