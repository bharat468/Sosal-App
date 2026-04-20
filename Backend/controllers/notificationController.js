import Notification from "../models/Notification.js";
import FollowRequest from "../models/FollowRequest.js";
import Follow from "../models/Follow.js";
import { buildNotificationKey } from "../utils/notificationHelpers.js";

// GET /api/notifications
export const getNotifications = async (req, res) => {
  const page  = parseInt(req.query.page  || 1);
  const limit = parseInt(req.query.limit || 30);

  const [rawNotifications, pendingRequests] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate("sender", "id username name avatar")
      .populate("post", "id mediaUrl caption"),
    FollowRequest.countDocuments({ recipient: req.user._id }),
  ]);

  const seen = new Set();
  const notifications = rawNotifications.filter((notification) => {
    const key = buildNotificationKey(notification);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const total = notifications.length;
  const unread = notifications.filter((notification) => !notification.read).length;
  const pagedNotifications = notifications.slice((page - 1) * limit, page * limit);

  const followNotifSenders = pagedNotifications
    .filter((n) => n.type === "follow")
    .map((n) => n.sender?._id || n.sender?.id)
    .filter(Boolean)
    .map((id) => id.toString());

  const [followingRows, requestedRows] = followNotifSenders.length > 0 ? await Promise.all([
    Follow.find({ follower: req.user._id, following: { $in: followNotifSenders } }).select("following"),
    FollowRequest.find({ sender: req.user._id, recipient: { $in: followNotifSenders } }).select("recipient"),
  ]) : [[], []];

  const followingIds = new Set(followingRows.map((row) => row.following.toString()));
  const requestedIds = new Set(requestedRows.map((row) => row.recipient.toString()));

  res.json({
    notifications: pagedNotifications.map((n) => {
      const obj = { ...n.toObject(), id: n._id };
      const senderId = obj.sender?._id || obj.sender?.id;
      if (obj.type === "follow" && senderId) {
        const sid = senderId.toString();
        obj.followStatus = followingIds.has(sid) ? "following" : requestedIds.has(sid) ? "requested" : "none";
      }
      return obj;
    }),
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
