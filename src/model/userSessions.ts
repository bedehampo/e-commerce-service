import mongoose, { Schema } from "mongoose";

const userSessionSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    user_agent: {
      type: String,
      required: true,
    },
    ip_address: {
      type: String,
      required: true,
    },
    
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("userSession", userSessionSchema);
