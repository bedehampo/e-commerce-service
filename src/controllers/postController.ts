// import { NextFunction, Request, Response } from "express";
// import { Post } from "../model/connect/posts";
// import {
//   AuthorizationError,
//   NotFoundError,
//   ServiceError,
//   ValidationError,
// } from "../errors";
// import { User } from "../model/User";
// import multer from "multer";
// import bcrypt from "bcryptjs";
// import { CustomTransform } from "../utils/customTransform";
// import { successResponse } from "../helpers";
// import { Transform, Readable } from "node:stream";
// import { CustomRequest, ReportType } from "../utils/interfaces";
// import { highlights } from "../utils/global";
// import { ReportPost } from "../model/connect/reportPost";
// // import streamData from "../middlewares/dataStream";

// // @desc    Create post
// // @Access  Private
// // @route   POST /api/posts

// export const getTotalPostsCount = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const posts = await Post.find({});

//     return res.send(
//       successResponse("", {
//         totalPostsCount: posts.length,
//       })
//     );
//   } catch (err) {
//     next(err);
//   }
// };

// export const getTotalFlaggedPosts = async (req: CustomRequest, res: Response, next: NextFunction) => {
//   try {
//     const flaggedPosts = await ReportPost.find({});

//     return res.send(successResponse('', {
//       totalFlaggedPostsCount: flaggedPosts.length
//     }))
//   } catch (err) {
//     next(err);
//   }
// }

// export const createPost = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { user } = req;
//   let { photos, taggedUsers } = req.body;

//   try {
//     // Add user ID to post body
//     req.body.user = user.id;

//     // Filter out the author from the tagged users
//     const filteredTags =
//       taggedUsers?.filter((taggedUser: string) => taggedUser !== user.id) || [];

//     // Check if the author is in the list of tagged users after filtering
//     if (filteredTags.includes(user.id)) {
//       return next(new ServiceError("You are unable to tag yourself to a post"));
//     }

//     // Validate tagged users exist in the database
//     const existingUsers = await User.find({ _id: { $in: filteredTags } });

//     if (
//       filteredTags.length > 0 &&
//       existingUsers.length !== filteredTags.length
//     ) {
//       return next(new NotFoundError("One or more tagged users do not exist"));
//     }

//     // Process photos (assuming they're passed as filenames in an array of strings)
//     if (!photos || photos.length === 0) {
//       return next(new ValidationError("One or more images are required"));
//     }

//     // Create the post with the processed photos and tags
//     const post = await Post.create({
//       photos,
//       taggedUsers: existingUsers,
//       ...req.body,
//     });

//     res.status(201).json({
//       success: "true",
//       message: "Post created successfully",
//       data: post,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// // @desc    Edit post
// // @access  Private
// // @route   PATCH api/posts/:id

// export const editPost = async (req: any, res: Response, next: NextFunction) => {
//   const { description, allowComment, allowRepost } = req.body;
//   const { id } = req.params;
//   const loggedInUser = req.user.id;
//   try {
//     // Find post using id
//     let post = await Post.findById(id);

//     // Check if post exists
//     if (!post) {
//       return next(new NotFoundError("Post does not exists"));
//     }

//     // Check if logged in user is the owner of post
//     if (post.user?.toString() !== loggedInUser) {
//       return next(new AuthorizationError());
//     }

//     // console.log(loggedInUser);

//     // Update post and save
//     post.description = description;
//     post.allowComment = allowComment;
//     post.allowRepost = allowRepost;

//     const updatedPost = await Post.findByIdAndUpdate(
//       id,
//       { description, allowComment, allowRepost },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     res.status(200).json({
//       success: "true",
//       message: "Post updated successfully",
//       data: updatedPost,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const reportPost = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { reportMessage, postId, commentId, reporterId, userId, reportType } =
//       req.body;

//     if (reportType !== ReportType.Post && reportType !== ReportType.Comment) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid report type",
//       });
//     }

//     // Validate the reporter and the post user
//     if (reporterId === userId && reportType === "post") {
//       return next(new NotFoundError("Your cannot report your post"));
//     }

//     // Find post using id
//     let post = await Post.findById(postId);

//     // Check if post exists
//     if (!post) {
//       return next(new NotFoundError("Post does not exists"));
//     }

//     // Check if comment exists
//     const comment: any = post.comments.find(
//       (comment: any) => comment._id.toString() === commentId
//     );

//     if (reportType == ReportType.Comment && !comment) {
//       return next(new NotFoundError("Comment does not exist"));
//     }
//     // Create a new report document based on the report type
//     const newReport = await ReportPost.create({
//       reportMessage,
//       reporterId,
//       userId,
//       reportType,
//       postId: reportType === ReportType.Post ? postId : undefined,
//       commentId: reportType === ReportType.Comment ? commentId : undefined,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Reported successfully",
//       data: newReport,
//     });
//   } catch (error) {
//     console.error("Error reporting:", error);
//     next(error);
//   }
// };

// export const getFeeds = async (req: any, res: any, next: NextFunction) => {
//   try {
//     const loggedInUserId = req.user.id;

//     // Fetch the logged-in user's followers and those they're following
//     const user = await User.findById(loggedInUserId);
//     if (!user) {
//       return next(new NotFoundError("User not found"));
//     }

//     const followers = user.followers.map((follower) => follower.toString());
//     const following = user.followings.map((follow) => follow.toString());
//     const usersToFetch = [...followers, ...following, loggedInUserId];

//     // Fetch all posts from the specified users
//     // const postsFromFollowersAndFollowing = await Post.find({
//     //   user: { $in: usersToFetch },
//     // }).populate("user", "avatar firstName lastName profilePictureUrl");

//     const postsFromFollowersAndFollowing = await Post.find().populate(
//       "user",
//       "avatar firstName lastName profilePictureUrl"
//     );

//     // Merge the posts
//     const allPosts = [...postsFromFollowersAndFollowing];

//     // Sort all the posts by createdAt in descending order (most recent first)
//     // allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

//     allPosts.sort((a: any, b: any) => {
//       let dateA = new Date(a.createdAt);
//       let dateB = new Date(b.createdAt);

//       if (!dateA || !dateB) return 0;

//       return dateB.getTime() - dateA.getTime();
//     });

//     // Pagination parameters
//     const page = parseInt(req.query.page, 10) || 1; // Current page number
//     const limit = parseInt(req.query.limit, 10) || 10; // Number of items per page

//     // Calculate pagination boundaries
//     const startIndex = (page - 1) * limit;
//     const endIndex = page * limit;

//     // Slice the allPosts array to get the current page of posts
//     const paginatedPosts = allPosts.slice(startIndex, endIndex);

//     return res.status(200).json({
//       success: true,
//       data: paginatedPosts,
//       count: paginatedPosts.length,
//       totalPages: Math.ceil(allPosts.length / limit), // Calculate total pages based on all posts
//       currentPage: page,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const deletePost = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { id } = req.params;
//   const loggedInUser = req.user.id;
//   try {
//     const post = await Post.findById(id).populate(
//       "user",
//       "avatar firstName lastName profilePictureUrl"
//     );

//     // Check if post exists
//     if (!post) {
//       return next(new NotFoundError("Post doesn't exist"));
//     }

//     // Check if logged in user is the owner of post
//     // if (post.user?.id.toString() !== loggedInUser) {
//     //   return next(
//     //     new AuthorizationError("You are not authorized to delete this post")
//     //   );
//     // }

//     post.deleteOne();
//     res.status(200).json({
//       success: true,
//       data: {},
//       message: "Post deleted successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc     Get all posts
// // @access   Private
// // @route    GET api/posts/:userId/posts

// export const getUserPosts = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { id } = req.params;
//   try {
//     const posts = await Post.find({ user: id });

//     res.status(200).json({
//       success: true,
//       count: posts.length,
//       data: posts,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// //@desc    Get a user's single post
// //@route   GET /api/posts/:postId/:userId
// //@access  Private

// export const getUserSinglePost = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { userId, postId } = req.params;
//     const post = await Post.findOne({ _id: postId }).populate(
//       "user",
//       "avatar firstName lastName profilePictureUrl"
//     );
//     // Check for the existence of this post
//     if (!post) {
//       return next(new NotFoundError("Post not found"));
//     }

//     res.status(200).json({
//       success: true,
//       data: post,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Repost a post
// // @access  Private
// // @route   POST api/posts/:id/repost

// export const repost = async (req: any, res: Response, next: NextFunction) => {
//   try {
//     const postId = req.params.id;
//     const userId = req.user.id;

//     // Find post to be reposted
//     const originalPost = await Post.findById(postId);

//     // Check if post exists
//     if (!originalPost) {
//       return next(new NotFoundError("Post not found"));
//     }

//     // Check if user allows repost
//     if (!originalPost.allowRepost) {
//       return next(new AuthorizationError("You are unable to repost this post"));
//     }

//     // Check if the post has already been reposted
//     const existingRepost = await Post.findOne({
//       repostedFrom: originalPost,
//       user: userId,
//     });
//     if (existingRepost) {
//       return next(new ServiceError("You already reposted this post"));
//     }

//     // Create a repost
//     const repostedPost = await Post.create({
//       repostedFrom: originalPost._id,
//       user: userId,
//       description: originalPost.description,
//       originalPoster: originalPost.user,
//       allowComment: originalPost.allowComment,
//       allowRepost: originalPost.allowRepost,
//       photos: originalPost.photos,
//       taggedUsers: originalPost.taggedUsers,
//       exactLocation: originalPost.exactLocation,
//       altText: originalPost.altText,
//     });

//     // Check if repost count is undefined and increase repost count
//     if (originalPost.repostCount !== undefined) {
//       originalPost.repostCount++;
//     }

//     // Save reposted posts to db
//     await originalPost.save();
//     await repostedPost.save();

//     res.status(200).json({
//       success: true,
//       message: "You reposted this!",
//       data: repostedPost,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// //@desc    undo repost
// //@route   PUT /api/posts/undoRepost/:postId
// //@access  Private

// export const undoRepost = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { repostedPostId } = req.params;
//     const userId = req.user.id;

//     const repostedPost = await Post.findById(repostedPostId);

//     console.log(repostedPostId);

//     // Check if post was reposted
//     if (!repostedPost) {
//       return next(new NotFoundError("This post does not exist"));
//     }
//     console.log(userId);

//     // Check if logged-in user was the reposter of the post
//     if (repostedPost.user.toString() !== userId) {
//       return next(
//         new AuthorizationError("You are not allowed to undo this repost")
//       );
//     }

//     // Find reposted post
//     const post = await Post.findById(repostedPost.repostedFrom);

//     // Check if reposted post exists
//     if (!post) {
//       return next(new NotFoundError("Post not found"));
//     }

//     repostedPost.repostedFrom = undefined;

//     // Reduce the number of repost count when a repost is undone
//     if (post.repostCount > 0) {
//       post.repostCount--;
//     }

//     // Save post and and delete repostedPost
//     await post.save();
//     await repostedPost.deleteOne();

//     res.status(200).json({
//       success: true,
//       data: {},
//       message: "You successfully undid this repost!!!!",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// //@desc      Like a post
// //@route     POST /api/posts/:id/like
// //@access    Private

// export const likePost = async (req: any, res: Response, next: NextFunction) => {
//   try {
//     const { id } = req.params;

//     // Fetch the post and ensure its existence
//     const post: any = await Post.findById(id);
//     if (!post) {
//       return next(new NotFoundError("Post not found"));
//     }

//     // Check for double liking
//     const alreadyLiked: any = post.likes.includes(req.user.id);
//     if (alreadyLiked) {
//       return next(new ValidationError("You already liked this post"));
//     }

//     // Add the user's ID to the likes array if not already present
//     const updatedPost: any = await Post.findByIdAndUpdate(
//       id,
//       { $addToSet: { likes: req.user.id } },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     // Update the likes count
//     updatedPost.likesCount = updatedPost.likes.length;

//     // Fetch the user associated with the post
//     const user: any = await User.findById(updatedPost.user).select(
//       "avatar firstName lastName profilePictureUrl"
//     );
//     if (user) {
//       updatedPost.user = user;
//     }

//     await updatedPost.save();

//     res.status(200).json({
//       success: true,
//       data: updatedPost,
//       message: "You just liked this post",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// //@desc    Unlike a post
// //@route   DELETE /api/posts/:id/unlike
// //@access  Private

// export const unlikePost = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;

//     // Fetch the post and ensure its existence
//     const post: any = await Post.findById(id);
//     if (!post) {
//       return next(new NotFoundError("Post not found"));
//     }

//     // Check if the user has liked the post
//     const hasLiked = post.likes.includes(req.user.id);
//     if (!hasLiked) {
//       return next(new ValidationError("You have not liked this post yet!"));
//     }

//     // Remove user's ID from the likes array and decrease the likes count
//     post.likes.pull(req.user.id);
//     post.likesCount = post.likes.length;

//     // Save the updated post
//     const updatedPost: any = await post.save();

//     // Fetch the user associated with the updated post and replace the user property
//     const user: any = await User.findById(updatedPost.user).select(
//       "firstname lastname avatar profilePictureUrl"
//     );
//     if (user) {
//       updatedPost.user = user;
//     }

//     res.status(200).json({
//       success: true,
//       data: updatedPost,
//       message: "You unliked this post!",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// //@desc      Add comment to a post
// //@route     POST /api/posts/:id/comment
// //@access    Private

// export const addCommentToPost = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // Extracting data
//     const { id } = req.params;
//     const { text } = req.body;
//     const postedBy = req.user.id;

//     // Find the post by its ID
//     const post: any = await Post.findById(id);
//     if (!post) {
//       return next(new NotFoundError("Post does not exists"));
//     }

//     // Check post and user conditions before commenting
//     if (!post.allowComment) {
//       return next(
//         new AuthorizationError("You are not allowed to comment on this post")
//       );
//     }

//     if (!text || text.trim() === "") {
//       return next(new ValidationError("This field cannot be empty"));
//     }

//     // Construct the comment
//     const comment: any = { text, postedBy };

//     // Add comment to post and save
//     post.comments.push(comment);
//     await post.save();

//     // Return the successful response
//     res.status(200).json({
//       success: true,
//       data: post,
//       message: "Your comment has been added successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// //@desc     Delete comment
// //@route    DELETE /api/posts/:postId/commentId
// //@access   Private

// export const deleteComment = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const postId = req.params.postId;
//     const commentId = req.params.commentId;

//     const post: any = await Post.findById(postId);

//     // Check if post exists
//     if (!post) {
//       return next(new NotFoundError("This post does not exist"));
//     }

//     // Check if comment exists
//     const comment: any = post.comments.find(
//       (comment: any) => comment._id.toString() === commentId
//     );

//     if (!comment) {
//       return next(new NotFoundError("Comment does not exist"));
//     }
//     // Ensure that user deleting comment made the post

//     console.log(comment.postedBy);
//     console.log(req.user.id);

//     if (comment.postedBy.toString() !== req.user.id) {
//       return next(
//         new AuthorizationError("You are not allowed to delete this comment")
//       );
//     }

//     post.comments = post.comments.filter(({ id }: any) => id !== commentId);
//     const updatedPost = await post.save();

//     res.status(200).json({
//       success: true,
//       data: updatedPost,
//       message: "Comment deleted",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc      Like a comment
// // @route     PUT api/v1/posts/:postId/comments/commentId/like
// // @access    Private

// export const likeComment = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { postId, commentId } = req.params;
//     const userId = req.user.id;

//     const post = await Post.findById(postId);

//     // Check if post exists
//     if (!post) {
//       return next(new NotFoundError("This post does not exists"));
//     }

//     const comment: any = await post.comments.find(
//       (comment: any) => comment.id.toString() === commentId
//     );

//     // Check if comment exists
//     if (!comment) {
//       return next(new NotFoundError("Comment not found!"));
//     }

//     const alreadyLiked = comment.likes.includes(commentId);

//     console.log(alreadyLiked);

//     // Ensure that a user cannot like a comment twice
//     if (alreadyLiked) {
//       return next(new ValidationError("You have already liked this comment!"));
//     }

//     comment.likes.push(userId);

//     comment.likesCount++;

//     const user: any = await User.findById(post.user).select(
//       "avatar firstName lastName profilePictureUrl"
//     );
//     if (user) {
//       post.user = user;
//     }

//     const updatedPost = await post.save();

//     res.status(200).json({
//       success: true,
//       data: updatedPost,
//       message: "You liked this comment!",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Unlike a comment
// // @route   PUT /api/posts/:postId/comments/:commentId/unlike
// // @access  Private

// export const unlikeComment = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { postId, commentId } = req.params;
//     const userId = req.user.id;

//     const post = await Post.findById(postId);

//     if (!post) {
//       return next(new NotFoundError("This post does not exist"));
//     }

//     const comment: any = await post.comments.find(
//       (comment: any) => comment.id.toString() === commentId
//     );
//     if (!comment) {
//       return next(new NotFoundError("Comment not found"));
//     }
//     const likedComment = comment.likes.includes(userId);
//     // Ensure that a user cannot unlike a post twice
//     if (!likedComment) {
//       return next(new ValidationError("You have not liked this comment"));
//     }

//     comment.likes.pull(userId);
//     comment.likesCount--;

//     const user: any = await User.findById(post.user).select(
//       "avatar firstName lastName profilePictureUrl"
//     );
//     if (user) {
//       post.user = user;
//     }
//     const updatedPost = await post.save();

//     res.status(200).json({
//       success: true,
//       data: updatedPost,
//       message: "You have successfully unliked this comment!",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Get a post comments
// // @route   GET /api/posts/:postId/comments
// // @access  Private

// export const getPostComments = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { postId } = req.params;
//     const post: any = await Post.findById(postId);
//     if (!post) {
//       return next(new NotFoundError("This post does not exist"));
//     }

//     // 3. Sort comments by their creation date in descending order
//     const sortedComments = post.comments.sort(
//       (a: any, b: any) => b.createdAt - a.createdAt
//     );

//     // 4. Return the sorted comments in the response
//     res.status(200).json({
//       success: true,
//       data: sortedComments,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Get a post likes
// // @route   GET /api/posts/:postId/likes
// // @access  Private

// export const getPostLikes = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;

//     const post = await Post.findById(id);

//     if (!post) {
//       return next(new NotFoundError("This post does not exist"));
//     }

//     const likes = post.likes;

//     res.status(200).json({
//       success: true,
//       data: likes,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Nested Replies in a comment
// // @route   PUT /api/posts/:postId/comments/:commentId/replies
// // @access  Private

// //get list of replies for a comment
// export const getReplies = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { postId, commentId } = req.params;

//     const post = await Post.findById(postId);

//     if (!post) {
//       return next(new NotFoundError("This post does not exist"));
//     }

//     const comment: any = await post.comments.find(
//       (comment: any) => comment.id.toString() === commentId
//     );

//     if (!comment) {
//       return next(new NotFoundError("Comment not found"));
//     }

//     const replies = comment.replies; // Get the list of replies for the comment

//     res.status(200).json({
//       success: true,
//       data: replies,
//       message: "List of replies for the comment",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const replyComment = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { postId, commentId } = req.params;

//     const post = await Post.findById(postId);

//     if (!post) {
//       return next(new NotFoundError("This post does not exist"));
//     }

//     const comment: any = await post.comments.find(
//       (comment: any) => comment.id.toString() === commentId
//     );

//     console.log(comment);

//     if (!comment) {
//       return next(new NotFoundError("Comment not found"));
//     }

//     const reply = {
//       text: req.body.text,
//       postedBy: req.user.id,
//     };

//     if (!reply.text || reply.text === "") {
//       return next(new ServiceError("This field cannot be empty"));
//     }
//     // Add replies to a comment
//     comment.replies.push(reply);

//     console.log(comment);

//     const updatedPost = await post.save();

//     res.status(200).json({
//       success: true,
//       data: updatedPost,
//       message: "You added a reply!",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc     Like a reply
// // @route    PUT /api/posts/:postId/comments/:commentId/replies/:replyId/like
// // @access   Private

// export const likeReply = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { postId, commentId, replyId } = req.params;

//     const post = await Post.findById(postId);

//     // Check if post exist
//     if (!post) {
//       return next(new NotFoundError("This post does not exist"));
//     }

//     // Check if comment exist
//     const comment: any = post.comments.find(
//       (comment: any) => comment._id.toString() === commentId
//     );

//     if (!comment) {
//       return next(new NotFoundError("Comment not found"));
//     }

//     const reply: any = comment.replies.find(
//       (reply: any) => reply._id.toString() === replyId
//     );

//     if (!reply) {
//       return next(new NotFoundError("Reply does not exist"));
//     }

//     const likedReply = reply?.likes?.includes(req.user.id);

//     // Check if user already liked a reply
//     if (likedReply) {
//       return next(new ValidationError("You already liked this reply"));
//     }

//     reply?.likes?.push(req.user.id);
//     reply.likesCount++;

//     await post.save();

//     res.status(200).json({
//       success: true,
//       data: post,
//       message: "You liked this reply!!",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc     Unlike a reply
// // @route    PUT /api/posts/:postId/comments/:commentId/replies/:replyId
// // @access   Private

// export const unlikeReply = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { postId, commentId, replyId } = req.params;
//     const post = await Post.findById(postId);

//     if (!post) {
//       return next(new NotFoundError("Post doesn't exist"));
//     }

//     const comment: any = post.comments.find(
//       (comment: any) => comment._id.toString() === commentId
//     );

//     if (!comment) {
//       return next(new NotFoundError("Comment not found"));
//     }

//     const reply = comment.replies.find((reply: any) => reply._id === replyId);

//     if (!reply) {
//       return next(new NotFoundError("Reply does not exist"));
//     }

//     const likedReply = reply.likes.inncludes(req.user.id);

//     if (!likedReply) {
//       return next(new ValidationError("You have not liked this post"));
//     }

//     reply?.likes?.pull(req.user.id);
//     reply.likesCount--;
//     await post.save();

//     res.status(200).json({
//       success: true,
//       data: post,
//       message: "You unliked this post!!",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc     Share a post
// // @route    GET /api/posts/:postId/share
// // @access   Private

// export const sharePost = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { postId, userId } = req.params;
//     const user = await User.findById(userId);
//     if (!user) {
//       return next(new NotFoundError(`User with id ${userId} is not found`));
//     }
//     const post = await Post.findById(postId);

//     if (!post) {
//       return next(new NotFoundError("Post does not exist"));
//     }

//     // Encrypt PostId
//     let postString = postId;
//     const salt = await bcrypt.genSalt(10);

//     postString = await bcrypt.hash(postString, salt);

//     // Encrypt user id
//     let userString = userId;
//     userString = await bcrypt.hash(userString, salt);

//     const postUrl = `http://localhost:8000/api/posts/${postString}/${userString}`;

//     res.status(200).json({
//       success: true,
//       data: postUrl,
//       message: "You have successfully shared this post",
//     });
//   } catch (error) {
//     next(error);
//   }
// };
