import mongoose from 'mongoose'
import { tuple } from 'zod';

const ChatSchema = new mongoose.Schema({
  username: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: true,
  },
  password: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: true,
  },
  nickname: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: true,
    default: null,
  },
  timestamps: {
    type: Boolean,
    default: true,
    required: true,
  },
})

export default mongoose.model('chat', ChatSchema);