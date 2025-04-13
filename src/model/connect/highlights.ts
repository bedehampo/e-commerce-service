import mongoose from 'mongoose'

const highlightSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  // status: {
  //   type: String,
  //   enum: ['Inactive', 'Active', 'Deleted'],
  //   required: true,
  // },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

export const Highlight = mongoose.model('highlight', highlightSchema);