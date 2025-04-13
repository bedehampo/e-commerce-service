// import { NextFunction, Request, Response } from "express";
// import { addCommentToPost, deleteComment, getFeeds, getPostLikes, likePost, unlikePost } from "../controllers/postController";
// import { getPostComments } from "../controllers/postController";

// export const getFeedsSocket = async (socket) => {
//   socket.on('getFeeds', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const feeds = await getFeeds(req, res, next);
//       console.log('Emitting');
//       socket.emit('getFeeds', feeds); 
//     } catch (error) {
//       console.error(error)
//       socket.emit('error', error);
//     }
//   })
// }

// export const likePostSocket =async (socket:any) => {
//   socket.on('likePost', async (req:Request, res: Response, next: NextFunction) => {
//     try {
//       const likes = await likePost(req, res, next);
//       socket.emit('likePost', likes);
//     } catch (error) {
//       console.error(error);
//       socket.emit('error', error);
//     }
//   })
// }

// export const addCommentSocket = async (socket:any) => {
//   socket.on('addComment',async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const comments = await addCommentToPost(req, res, next);
//       socket.emit('addComment', comments);
//     } catch (error) {
//       console.error('error', error)
//       socket.emit('error', error);
//     }
//   })
// }

// export const unlikePostSocket = async (socket: any) => {
//   socket.on("unlikePost", async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const unlike = await unlikePost(req, res, next)
//       socket.emit('unlikePost', unlike);
//     } catch (error) {
//       console.error(error);
//       socket.emit('error', error);
//     }
      
//   })
// }

// export const deleteCommentSocket = async (socket: any) => {
//   socket.on('deletePostComment', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const deletePostComment = await deleteComment(req, res, next)
//       socket.emit('deletePostComment', deletePostComment);
//     } catch (error) {
//       console.error(error)
//       socket.emit('error', error)
//     }
//   })
// }

// export const getLikesSocket = async (socket: any) => {
//   socket.on('getLikes', async (req: Request, res: Response, next: NextFunction) => {
//     const likes = await getPostLikes(req, res, next)
//     try {
//       socket.emit('getLikes', likes)
//     } catch (error) {
//       console.error(error)
//       socket.emit('error', error)
//     }
//   })
// }

// export const getCommentsSocket =async (socket:any) => {
//   socket.on('getComments', async (req: Request, res: Response, next: NextFunction) => {
//     const comments = await getPostComments(req, res, next);
//     try {
//       socket.emit('getComments', comments)
//     } catch (error) {
//       console.error(error)
//       socket.emit('error', error);
//     }
//   })
// }