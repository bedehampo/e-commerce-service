import mongoose, { Schema } from 'mongoose';

import { FlagTypes, IIdempotencyKey } from "../utils/interfaces";
import { string } from "joi";
import config from "../config";


const IdempotencyKeySchema: Schema = new Schema({
    key: { 
        type: String, 
        required: true,
        unique: true
    },
    transactionId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date
    }
});

export const IdempotencyKey = mongoose.model<IIdempotencyKey>("idempotencyKey", IdempotencyKeySchema);