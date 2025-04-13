import mongoose from 'mongoose'
import { StorySchema } from '../../utils/interfaces';

const StorySchema = new mongoose.Schema<StorySchema>({
  photo: {
    type: String,
    required: [true, 'Image is required']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
  },
  
  viewCount: {
    type: Number,
    default: 0
  },
  viewers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'user',
  }],
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default :Date.now(),
  }, 
});

export const Story = mongoose.model('story', StorySchema);