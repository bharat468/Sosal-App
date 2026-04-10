import Notification from "../models/Notification.js";
import Comment from "../models/Comment.js";

export const emitNotif = async (recipientId, payload) => {
  try {
    const { io, onlineUsers } = await import("../index.js");
    const socketId = onlineUsers.get(recipientId.toString());
    if (socketId) io.to(socketId).emit("notification", payload);
  } catch {}
};

export const emitNotificationRefresh = async (recipientId) => {
  try {
    const { io, onlineUsers } = await import("../index.js");
    const socketId = onlineUsers.get(recipientId.toString());
    if (socketId) io.to(socketId).emit("notifications_changed");
  } catch {}
};

export const buildNotificationKey = (notification) => {
  const type = notification.type || "";
  const senderId = (notification.sender?._id || notification.sender || "").toString();
  const postId = (notification.post?._id || notification.post || "").toString();

  if (type === "follow" || type === "follow_request" || type === "follow_accepted") {
    return `${type}:${senderId}`;
  }

  if (type === "like" || type === "comment") {
    return `${type}:${senderId}:${postId}`;
  }

  const commentId = (notification.comment?._id || notification.comment || "").toString();
  return `${type}:${senderId}:${postId}:${commentId}:${notification._id || notification.id || ""}`;
};

export const createOrReplaceNotification = async (data, populate = []) => {
  const filter = {
    type: data.type,
    recipient: data.recipient,
    sender: data.sender,
    ...(data.post ? { post: data.post } : {}),
  };

  await Notification.deleteMany(filter);

  const notification = await Notification.create(data);

  for (const field of populate) {
    await notification.populate(field.path, field.select);
  }

  return notification;
};

export const removeNotification = async (filter) => {
  await Notification.deleteMany(filter);
};

export const syncCommentNotification = async ({ recipient, sender, post }) => {
  const latestComment = await Comment.findOne({ author: sender, post }).sort({ createdAt: -1 });

  if (!latestComment) {
    await Notification.deleteMany({ type: "comment", recipient, sender, post });
    return null;
  }

  return createOrReplaceNotification(
    {
      type: "comment",
      recipient,
      sender,
      post,
      comment: latestComment._id,
      read: false,
    },
    [
      { path: "sender", select: "id username name avatar" },
      { path: "post", select: "id mediaUrl caption" },
    ]
  );
};
