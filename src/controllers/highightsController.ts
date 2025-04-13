// import { NextFunction, Response } from 'express'
// import {Highlight } from '../model/connect/highlights'
// import { generateHighlight } from '../utils/global';
// import { AuthorizationError, NotFoundError } from '../errors';
// import { Transform } from 'node:stream'
// import { User } from '../model/User';


// // @desc    Create highlight
// // @route   POST /api/highlights
// // @access  Private

// export const createHighlight = async (req: any, res: any, next: NextFunction) => {
//   req.body.user = req.user.id

//   const {data, type} = req.body
//   try {
//     let {content} = req.body;

//     content = generateHighlight(type, data);
//     const newHightlight = await Highlight.create({
//       content,
//       ...req.body
//     })

//     res.status(201).json({
//       success: true,
//       data: newHightlight,
//       messaged: 'You have successfully created an highlight',
//     })
//   } catch (error) {
//     next(error)
//   }
// }

// // @desc      Get all user highlight
// // @route     GET /api/highlights
// // @access    Private


// export const getAllUserHighlights = async (req: any, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.params.id; // Extract the user ID from the URL parameter

//     // Query the database for highlights associated with the user ID
//     const highlights = await Highlight.find({ user: userId }).populate(
//       "user",
//       "avatar firstName lastName profilePictureUrl"
//     );
// ;

//     res.status(200).json({
//       success: true,
//       data: highlights,
//       count: highlights.length,
//     });
//   } catch (error) {
//     next(error);
//   }
// };



// // @desc      Get all highlight
// // @route     GET /api/highlights
// // @access    Private


// export const getAllHighlights = async (req: any, res: Response, next: NextFunction) => {
//   try {
//     // const userId = req.params.id; // Extract the user ID from the URL parameter

//     // Query the database for highlights associated with the user ID
//     const highlights = await Highlight.find().populate(
//       "user",
//       "avatar firstName lastName profilePictureUrl"
//     );
// ;

//     res.status(200).json({
//       success: true,
//       data: highlights,
//       count: highlights.length,
//     });
//   } catch (error) {
//     next(error);
//   }
// };




// // @desc      Get a user's single highlight
// // @route     GET /api/highlights/:id
// // @access    Private

// export const getSingleHighlight = async (req: any, res: any, next: NextFunction) => {
//   const { userId, highlightId } = req.params
  
//   try {
//     const highlight = await Highlight.findOne({_id: highlightId, user: userId}).populate(
//       "user",
//       "avatar firstName lastName profilePictureUrl"
//     );


//     // Check if highlight exists
//     if (!highlight) {
//       return next(new NotFoundError('Highlight not found'));
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Successfullly retrieved the highlight',
//       data: highlight,
//     })
//   } catch (error) {
//     next(error)
//   }
// }

// // @desc      Delete Highlight
// // @route     DELETE /api/highlights/:id
// // @access    Private

// export const deleteHighlight = async (req: any, res: any, next: NextFunction) => {
//   const { id } = req.params
//   const loggedInUser = req.user.id

//   const highlight = await Highlight.findById(id);

//   // Check if highlight exists
//   if (!highlight) {
//     return next(new NotFoundError('Highlight does not exist'))
//   }

//   console.log(req.params.id);

//   // Check if logged in user is the owner of the highlight
//   if (highlight.user?.toString() !== loggedInUser) {
//     return next (new AuthorizationError('You are not authorized to delete this highlight'))
//   }
//   highlight.deleteOne()
//   res.status(200).json({
//     success: true,
//     message: 'Your highlight has been deleted',
//     data: {}
//   })
// }