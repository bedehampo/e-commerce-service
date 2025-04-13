import mongoose, { Schema } from "mongoose";

const eventRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    no_of_tickets: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: ["regular", "vip", "table_for_five", "table_for_ten"],
    },
    phone_number: { type: String, required: true },
    event: { type: Schema.Types.ObjectId, ref: "event" },
    user: { type: Schema.Types.ObjectId, ref: "user" },
  },
  {
    timestamps: true,
    collection: "event_requests",
  }
);

export default mongoose.model("eventRequest", eventRequestSchema);
