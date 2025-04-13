import mongoose, { Query } from "mongoose";
import geocoder from "../../utils/geocoder";
import { PostSchema } from "../../utils/interfaces";
import { NextFunction } from "express";
import { required } from "joi";

const PostSchema = new mongoose.Schema<PostSchema>({
  photos: [
    {
      type: String,
      required: true
    }
  ],
  description: {
    type: String,
    trim: true,
    max: 200
  },
  taggedUsers: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
    }
  ],
  exactLocation: String,
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
  },
  allowComment: {
    type: Boolean,
    default: true
  },
  allowRepost: {
    type: Boolean,
    default: true
  },
  altText: {
    type: String,
    default: "Image-alt"
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: [true, 'User is required'],
  },
  repostedFrom: {
    type: mongoose.Schema.ObjectId,
    ref: 'post'
  },
  isReposted: {
    type: Boolean,
    default: false,
  },
  repostedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'user'
  },
  originalPoster: {
    type: mongoose.Schema.ObjectId,
    ref: 'user'
  },
  likes: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'user'
    }
  ],
  likesCount: {
    type: Number,
    default: 0
  },
  comments: [{
    text: {
      type: String,  
    },
    postedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
    },
    likes: [{
      type: mongoose.Schema.ObjectId,
      ref: 'user'
    }],
    likesCount: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    replies: [
      {
        text: {
          type: String,
        },
        postedBy: {
          type: mongoose.Schema.ObjectId,
          ref: 'user',
        },
        likes: {
          type: mongoose.Schema.ObjectId,
          ref: 'user',
        },
        likesCount: {
          type: Number,
          default: 0
        },
        createdAt: {
          type: Date,
          default: Date.now,
        }
      }
    ]
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  repostCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

PostSchema.pre('save', async function (next: any) {
  try {
    if(this.exactLocation) {
      let loc = await geocoder?.geocode(this.exactLocation)
      if (!loc || loc.length === 0) {
        this.location = undefined
      } else {
        this.location = {
          coordinates: [loc[0].longitude, loc[0].latitude],
          formattedAddress: loc[0].formattedAddress,
          street: loc[0].streetName,
          city: loc[0].city,
          state: loc[0].stateCode,
          zipcode: loc[0].zipcode,
          country: loc[0].countryCode,
        }
        // Dont save exact address in db
        this.exactLocation = undefined;
    
        next();
      }
    }
  } catch (error) {
    next(error)
    console.log(error)
  }
})

export const Post = mongoose.model('post', PostSchema);

