// import { NextFunction, Response } from 'express'
// import {Story} from '../model/connect/story'
// import { AuthorizationError, NotFoundError, ValidationError } from '../errors';
// import moment from 'moment';

// import { Transform, Writable } from 'node:stream'
// import { User } from '../model/User';


// function scheduleDeleteStory(id: any) {
//   const delHours = 24 * 60 * 60 * 1000;

//   setTimeout(async (next: NextFunction) => {
//     try {
//       const deletedStory = await Story.findById(id)
//       if (!deletedStory) {
//         throw next(new NotFoundError('Story not found'))
//       }
//       deletedStory.deleteOne();  

//     } catch (error) {
//       next(error)
//     }
//   }, delHours);
// }


// // check if the story is expired

// function isWithinLast24Hours(timeStamp: Date | number): boolean {
//   const now: number = Date.now();
//   const twentyFourHoursAgo: number = now - (24 * 60 * 60 * 1000); // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds

//   // If timeStamp is an instance of Date, convert it to a Unix timestamp (milliseconds).
//   if (timeStamp instanceof Date) {
//       timeStamp = timeStamp.getTime();
//   }

//   return timeStamp >= twentyFourHoursAgo && timeStamp <= now;
// }

// // @desc      Create Story
// // @route     POST /api/story
// // @access    Private

// export const createStory = async (req, res, next) => {
//   try {
//     const { expiresAt, photo } = req.body;
//     const userId = req.user.id;

//     if (!photo || typeof photo !== 'string') {
//       return next(new ValidationError('Valid photo (as a string) is required'));
//     }

//     // Since we're getting expiresAt from req.body, it's best to use it when creating the story
//     const storyExpiresAt = expiresAt ? moment(expiresAt) : moment().add(1, 'days');

//     // Create the story
//     const story = await Story.create({
//       photo,
//       expiresAt: storyExpiresAt,
//       user: userId, // Associate the story with the logged-in user
//       ...req.body,
//     });

//     res.status(200).json({
//       success: true,
//       data: story,
//       message: 'Story created successfully',
//     });
//   } catch (error) {
//     next(error);
//   }
// };



// // @desc    Delete a story
// // @route   DELETE /api/story/:id
// // access   Private

// export const deleteStory = async (req: any, res: Response, next: NextFunction) => {
//   try {
//     const {id} = req.params
//     const loggedInUser = req.user.id

//     const story = await Story.findById(id)

//     if (!story) {
//       return next(new ValidationError('Story not found!'))
//     }

//     // Check if user is the owner of story
//     if (story.user?.toString() !== loggedInUser) {
//       return next(new AuthorizationError('You are not authorized to delete this story!'))
//     }

//     story.deleteOne()
//     res.status(200).json({
//       success: true,
//       data: {},
//       message: 'Story deleted successfully!'
//     })
//   } catch (error) {
//     next(error)
//   }
// }


// // @desc        Get all of a user's stories
// // @route       GET /api/users/:userId/story
// // @access      Private


// export const getAllStories = async (req: any, res: Response, next: NextFunction) => {
//   try {
//     const loggedInUserId = req.user.id;

//     // Fetch the logged-in user's followers
//     const user = await User.findById(loggedInUserId);
//     if (!user) {
//       return next(new NotFoundError('User not found'));
//     }

//     const followers = user.followers.map((follower) => follower);
//     const following = user.followings.map((follow) => follow);
//     const usersToFetch = [...followers, ...following, loggedInUserId];

//     const twentyFourHoursAgo = new Date();
//     twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

//     // Fetch stories from the specified users
//     const stories = await Story.find({ user: { $in: usersToFetch } });

//     // Create an array to store user objects with their stories
//     const usersWithStories: { user: any; stories: any[] }[] = [];

//     // Fetch user names and add them to the usersWithStories array
//     const users = await User.find({ _id: { $in: usersToFetch } });
//     users.forEach((u) => {
//       const userId = u._id.toString();
//       const userStories = stories.filter((story) => story.user.toString() === userId);

//       // Filter stories that are within 24 hours
//       const recentUserStories = userStories.filter((story) => story.createdAt >= twentyFourHoursAgo);

//       if (recentUserStories.length > 0) {
//         usersWithStories.push({
//           user: u.firstName + ' ' + u.lastName,
//           stories: recentUserStories,
//         });
//       }
//     });

//     // Filter out users with no stories within 24 hours
//     const filteredUsersWithStories = usersWithStories.filter((userWithStories) => userWithStories.stories.length > 0);

//     // Check if there are no stories
//     if (filteredUsersWithStories.length === 0) {
//       res.status(200).json({ success: false, message: 'No story found' });
//     } else {
//       res.status(200).json({
//         success: true,
//         data: filteredUsersWithStories,
//       });
//     }
//     console.log('Response sent');
//   } catch (error) {
//     next(error);
//   }
// };





// // @desc    Get a story
// // @route   GET /api/users/:userId/story/:storyId
// // @access  Private

// export const viewStory = async (req: any, res: any, next: NextFunction) => {
//   try {
//     const { id } = req.params
//     // const story: any = await Story.findById(id)

//     const story: any = await Story.findById(id);
    
//     console.log(story);
// if (!isWithinLast24Hours(story.createdAt)) {
//   return next(new ValidationError("Story has expired"));
// }
  

//     if (!story) {
//       return next(new NotFoundError('Story not found'))
//     }

//     // Ensure that the view of a story poster isn't registered
//     if (req.user?.id.toString() === story.user.toString()) {
//       res.status(200).json({
//         success: true,
//         data: story,
//       })
//     }else {
//       // Register a view
//       if (!story.viewers.includes(req.user.id)) { 
//         story.viewers.push(req.user.id);
//         story.viewCount++ ;
//         await story.save();
//       } 
  
//       res.status(200).json({
//         success: true,
//         data: story,
//       })
//     }
//   } catch (error) {
//     next(error)
//   }
// }