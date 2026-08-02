const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getUserNotifications,
  markNotificationsAsRead,
} = require("../controllers/notificationController");

const notificationRouter = express.Router();

notificationRouter.get(
  "/notifications",
  authMiddleware,
  getUserNotifications
);

notificationRouter.put(
  "/notifications/read",
  authMiddleware,
  markNotificationsAsRead
);

module.exports = notificationRouter;
