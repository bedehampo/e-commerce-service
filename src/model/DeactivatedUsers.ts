import mongoose, { Schema } from "mongoose";

const DeactivatedUserSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true, // Reference to the original user
  },
  reason: {
    type: String,
    required: true, // Reason for deactivation
  },
  deactivatedBy: {
    type: Schema.Types.ObjectId,
    ref: "adminUser", // Reference to the admin user who deactivated
  },
}, {
    timestamps: true
});

export const DeactivatedUser = mongoose.model(
  "deactivatedUser",
  DeactivatedUserSchema
);
