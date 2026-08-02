const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const {authorizeSelf} = require("../middlewares/authorizeMiddleware");

const userRouter = express.Router();

userRouter.post("/signup", userController.signup);
userRouter.post("/login", userController.login);

userRouter.get("/allUsers", authMiddleware, userController.getAllUsers);

userRouter.get("/userProfile/me", authMiddleware, userController.getMe);

// public profile — any authenticated user can view
userRouter.get("/userProfile/:id", authMiddleware, userController.getPublicProfile);

// follow / unfollow
userRouter.post("/follow/:id", authMiddleware, userController.followUser);

userRouter.put(
  "/updateProfile/:id",
  authMiddleware,
  authorizeSelf,
  userController.updateUserProfile
);

userRouter.delete(
  "/deleteProfile/:id",
  authMiddleware,
  authorizeSelf,
  userController.deleteUserProfile
);

module.exports = userRouter;
