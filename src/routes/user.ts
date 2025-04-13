// import { Router } from "express";
// import {
//   getAllUsers,
//   getSingleUser,
//   validateOtpAndUpdatePassword,
//   verifyOtpForUpdatePassword,
// } from "../controllers/authController";
// import { getUserPosts, getUserSinglePost } from "../controllers/postController";
// import {
//   addBeneficiary,
//   changePassword,
//   checkAndUpdateProfileComletion,
//   completeKyc,
//   filterByTagOrName,
//   followUser,
//   getBeneficiaries,
//   getFollowers,
//   getFollowings,
//   register,
//   resetPassword,
//   setMototag,
//   setPin,
//   twoFactorAuth,
//   unfollowUser,
//   updatePin,
//   updateUserInterest,
//   verifyBVN,
//   generateFollowQR,
//   uploadProfilePicture,
//   getUserConnections,
//   getUserByPhone,
//   getUserRecentSearch,
//   updateProfile,
//   suspendUserAccountAdmin,
// } from "../controllers/userController";
// import auth from "../middlewares/auth";
// import validateResource from "../middlewares/validateResource";
// import { RegisterSchema } from "../validation/register.schema";
// import { VerifyBvnSchema } from "../validation/verifyBvn.schema";
// import { updateProfileSchema } from "../validation/updateProfile.schema";
// import { DeactivatedUser } from "../model/DeactivatedUsers";
// import { authenticateAdmin } from "../middlewares/adminAuth";
// import { checkPermission } from "../middlewares/checkPermission";

// // import auth from "./auth";

// const router = Router();

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     RegisterSchema:
//  *       type: "object"
//  *       properties:
//  *         firstName:
//  *           type: "string"
//  *           description: "User's first name"
//  *           example: "John"
//  *         lastName:
//  *           type: "string"
//  *           description: "User's last name"
//  *           example: "Doe"
//  *         gender:
//  *           type: "string"
//  *           description: "User's gender"
//  *           enum: ["male", "female"]
//  *           example: "male"
//  *         phoneNumber:
//  *           type: "string"
//  *           description: "User's phone number"
//  *           example: "+1234567890"
//  *         password:
//  *           type: "string"
//  *           description: "User's password (at least 6 characters)"
//  *           example: "Passw0rd!"
//  *       required:
//  *         - firstName
//  *         - lastName
//  *         - gender
//  *         - phoneNumber
//  *         - password
//  *     VerifyBvnSchema:
//  *       type: "object"
//  *       properties:
//  *         bvn:
//  *           type: "string"
//  *           description: "User's Bank Verification Number"
//  *           example: "12345678901"
//  *           minLength: 11
//  *           maxLength: 11
//  *       required:
//  *         - bvn
//  */

// // To DO - Protect get all users routes so only authenticated users can access it

// /**
//  * @swagger
//  * /users:
//  *   get:
//  *     tags:
//  *       - Users
//  *     description: Get all users
//  *     responses:
//  *       200:
//  *         description: List of all users
//  */
// router.get("/", getAllUsers);

// /**
//  * @swagger
//  * /users/filter:
//  *   get:
//  *     tags:
//  *       - Users
//  *     description: Filter users by tag or name
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Filtered list of users
//  */
// router.get("/filter", auth, filterByTagOrName);

// /**
//  * @swagger
//  * /users/beneficiaries:
//  *   get:
//  *     tags:
//  *       - Users
//  *     description: Get beneficiaries
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: List of beneficiaries
//  */
// router.get("/beneficiaries", auth, getBeneficiaries);

// router.get("/get-user-recent-search", auth, getUserRecentSearch);

// /**
//  * @swagger
//  * /users/add-beneficiary:
//  *   post:
//  *     tags:
//  *       - Users
//  *     description: Add a beneficiary
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Beneficiary added successfully
//  */
// router.post("/add-beneficiary", auth, addBeneficiary);

// /**
//  * @swagger
//  * /users/{id}:
//  *   get:
//  *     tags:
//  *       - Users
//  *     description: Get single user
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: User ID
//  *     responses:
//  *       200:
//  *         description: Single user details
//  */
// router.get("/:id", getSingleUser);

// // Get user by phone
// router.get("/get-user-by-phone/:phone", getUserByPhone);

// // Register user
// /**
//  * @swagger
//  * /users:
//  *   post:
//  *     tags:
//  *       - Users
//  *     description: Register a new user
//  *     requestBody:
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/RegisterSchema'
//  *     responses:
//  *       200:
//  *         description: User registered successfully
//  */
// router.post("/", validateResource(RegisterSchema), register);

// // Set Mototag
// router.patch("/set-mototag", auth, setMototag);

// // Update bio
// router.patch('/update-profile', auth, validateResource( updateProfileSchema), updateProfile);

// // Change user password
// router.patch("/change-password", auth, changePassword);

// // Verify otp for data
// router.post(
//   "/verify-otp-for-update-password",
//   auth,
//   verifyOtpForUpdatePassword
// );

// // Validate otp and change password
// router.patch(
//   "/validate-otp-and-change-password', auth,validateOtpAndUpdatePassword"
// );

// // Reset password
// router.patch("/reset-password", resetPassword);

// // Two factor authentication
// router.patch("/set-two-factor", auth, twoFactorAuth);

// // Set Pin
// router.post("/set-pin", auth, setPin);

// // Complete KYC
// router.patch("/complete-kyc/:id", completeKyc);

// // update profile completion
// router.patch(
//   "/update-profile-completion",
//   auth,
//   checkAndUpdateProfileComletion
// );

// // Uppate Pin
// router.post("/update-pin", auth, updatePin);

// /**
//  * @swagger
//  * /users/verify-bvn:
//  *   post:
//  *     tags:
//  *       - Users
//  *     description: Verify a user's BVN
//  *     requestBody:
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/VerifyBvnSchema'
//  *     responses:
//  *       200:
//  *         description: BVN verified successfully
//  */
// router.post("/verify-bvn", auth, validateResource(VerifyBvnSchema), verifyBVN);

// // upload profile picture
// router.patch("/upload-profile-picture", auth, uploadProfilePicture);

// router.patch("/interest", auth, updateUserInterest);

// router.post("/verify-bvn", auth, validateResource(VerifyBvnSchema), verifyBVN);

// router.post("/deactivate-user", authenticateAdmin, checkPermission('deactivate-user'), suspendUserAccountAdmin );

// // Follow a user
// router.put("/:id/follow", auth, followUser);

// // Unfollow a user
// router.put("/:id/unfollow", auth, unfollowUser);

// // Get a user's followers
// router.get("/:id/followers", auth, getFollowers);

// // Get a user's followings
// router.get("/:id/followings", auth, getFollowings);

// // Get all of a user's posts
// router.get("/:id/posts", auth, getUserPosts);

// // // Get a user's single post
// router.get("/:userId/:postId", auth, getUserSinglePost);

// // Get all of a user's posts
// router.get("/:id/connection", auth, getUserConnections);

// // Generate QR Code
// router.get("/:id/follow/scan", generateFollowQR);

// export default router;
