import Notification from "../models/Notification.js";
import FollowRequest from "../models/FollowRequest.js";

// GET /api/notifications
export const getNotifications = async (req, res) => {
  const page  = parseInt(req.query.page  || 1);
  const limit = parseInt(req.query.limit || 30);

  const [notifications, total, unread, pendingRequests] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "id username name avatar")
      .populate("post", "id mediaUrl caption"),
    Notification.countDocuments({ recipient: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
    FollowRequest.countDocuments({ recipient: req.user._id }),
  ]);

  res.json({
    notifications: notifications.map((n) => ({ ...n.toObject(), id: n._id })),
    total, unread: unread + pendingRequests, page, pages: Math.ceil(total / limit),
  });
};

// PUT /api/notifications/read
export const markAllRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ message: "All marked as read" });
};

// PUT /api/notifications/:id/read
export const markOneRead = async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif || notif.recipient.toString() !== req.user._id.toString())
    return res.status(404).json({ message: "Not found" });
  await notif.updateOne({ read: true });
  res.json({ message: "Marked as read" });
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif || notif.recipient.toString() !== req.user._id.toString())
    return res.status(404).json({ message: "Not found" });
  await notif.deleteOne();
  res.json({ message: "Deleted" });
};
