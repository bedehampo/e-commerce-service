// import express from "express";
// import {
//   addCommentToPost,
//   createPost,
//   deleteComment,
//   deletePost,
//   editPost,
//   getFeeds,
//   getPostComments,
//   getPostLikes,
//   getReplies,
//   getTotalFlaggedPosts,
//   getTotalPostsCount,
//   getUserPosts,
//   getUserSinglePost,
//   likeComment,
//   likePost,
//   likeReply,
//   replyComment,
//   reportPost,
//   repost,
//   sharePost,
//   undoRepost,
//   unlikeComment,
//   unlikePost,
//   unlikeReply,
// } from "../controllers/postController";
// import auth from "../middlewares/auth";
// import { upload } from "../utils/multer";
// import { authenticateAdmin } from "../middlewares/adminAuth";
// import { checkPermission } from "../middlewares/checkPermission";

// const router = express.Router();

// // Repost
// router.put("/:id/repost", auth, repost);

// // Report a post
// router.post("/report", auth, reportPost);

// // Create post
// router.post("/", auth, upload.array("photos", 5), createPost);

// // Update description, allowComment, allowRepost
// router.patch("/:id", auth, editPost);

// // Delete post
// router.delete("/:id", auth, deletePost);

// // Undo repost
// router.put("/:repostedPostId/undorepost", auth, undoRepost);

// // Like a post
// router.patch("/:id/like", auth, likePost);

// // Unlike a post
// router.delete("/:id/unlike", auth, unlikePost);

// // Add comment to a post
// router.post("/:id/comment", auth, addCommentToPost);

// // Delete a comment
// router.delete("/:postId/comments/:commentId", auth, deleteComment);

// // Like a comment
// router.put("/:postId/comments/:commentId/like", auth, likeComment);

// // Unlike a comment
// router.delete("/:postId/comments/:commentId/unlike", auth, unlikeComment);

// // Get a post comments
// router.get("/:postId/comments", auth, getPostComments);

// // Get a post likes
// router.get("/:id/likes", auth, getPostLikes);

// // Reply a comment
// router.put("/:postId/comments/:commentId/reply", auth, replyComment);

// router.get("/:postId/comments/:commentId/replies", auth, getReplies);

// // Like a reply
// router.put(
//   "/:postId/comments/:commentId/replies/:replyId/like",
//   auth,
//   likeReply
// );

// // Unlike a reply
// router.put(
//   "/:postId/comments/:commentId/replies/:replyId/unlike",
//   auth,
//   unlikeReply
// );

// // Share a post
// router.get("/:postId/:userId", auth, sharePost);

// // Get all of a user's posts
// router.get("/feeds", auth, getFeeds);

// // get all posts by a user
// router.get("/:id", auth, getUserPosts);

// // get single post of a user
// router.get("/:postId/:userId", auth, getUserSinglePost);

// // Get all post count
// router.get('/', authenticateAdmin, checkPermission('get-total-post-count'), getTotalPostsCount);

// // Get all flagged/reported posts
// router.get('/', authenticateAdmin, checkPermission('get-total-post-count'), getTotalFlaggedPosts);

// export default router;
