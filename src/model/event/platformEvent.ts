import mongoose, { Schema } from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    pricePerTicket: { type: Number, required: true },
    description: { type: String, required: true },
    number_of_tickets_available: { type: Number, required: true },
    tickets_sold: { type: Number, default: 0 },
    categories: [
      {
        title: {
          type: String,
          required: true,
          enum: ["regular", "vip", "table_for_five", "table_for_ten"],
        },
        price: { type: Number, required: true },
      },
    ],
    featured_artists: [{ type: String, required: true }],
    discount: {
      type: Number,
    },
  },
  {
    timestamps: true,
    collection: "platform_events",
  }
);

export default mongoose.model("platformEvent", eventSchema);
