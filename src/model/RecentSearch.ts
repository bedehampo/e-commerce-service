import mongoose, { Schema } from "mongoose";

const RecentSearchSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
         query: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        collection: "recent_search",
    }
);

export const RecentSearch = mongoose.model("recent_search", RecentSearchSchema);