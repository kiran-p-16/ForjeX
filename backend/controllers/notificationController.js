const Notification = require("../models/notificationModel");

async function getUserNotifications(req, res) {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate("sender", "username profileImage")
      .populate("repository", "name")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function markNotificationsAsRead(req, res) {
  try {
    await Notification.updateMany(
      { recipient: req.userId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Helper to create & dispatch real-time socket notification
 */
async function sendNotification(app, { recipient, sender, type, repository, issue, message }) {
  try {
    if (recipient.toString() === sender.toString()) return; // Don't notify self

    const notif = await Notification.create({
      recipient,
      sender,
      type,
      repository,
      issue,
      message,
    });

    const populated = await Notification.findById(notif._id)
      .populate("sender", "username profileImage")
      .populate("repository", "name")
      .lean();

    const io = app.get("io");
    if (io) {
      io.to(recipient.toString()).emit("newNotification", populated);
    }
  } catch (err) {
    console.error("Send notification error:", err);
  }
}

module.exports = {
  getUserNotifications,
  markNotificationsAsRead,
  sendNotification,
};
