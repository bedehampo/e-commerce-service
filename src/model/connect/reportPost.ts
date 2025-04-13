import mongoose, { Query } from "mongoose";
import { ReportPostSchema, ReportType } from "../../utils/interfaces";

const ReportPostSchema = new mongoose.Schema<ReportPostSchema>({
  reportMessage: {
    type: String,
    required: true,
  },
  reportType: {
    type: String,
    enum: [ReportType.Post, ReportType.Comment],
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function (this: ReportPostSchema) {
      return this.reportType === ReportType.Post;
    },
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function (this: ReportPostSchema) {
      return this.reportType === ReportType.Comment;
    },
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'user',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const ReportPost = mongoose.model("reportPost", ReportPostSchema);
