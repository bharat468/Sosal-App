import Message from "../models/Message.js";
import Follow from "../models/Follow.js";
import User from "../models/User.js";

// GET /api/messages/conversations
export const getConversations = async (req, res) => {
  const userId = req.user._id;

  const messages = await Message.find({ $or: [{ sender: userId }, { receiver: userId }] })
    .sort({ createdAt: -1 })
    .populate("sender",   "id username name avatar")
    .populate("receiver", "id username name avatar");

  const seen = new Set();
  const conversations = [];

  for (const msg of messages) {
    const other = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;
    if (!seen.has(other._id.toString())) {
      seen.add(other._id.toString());
      const unread = await Message.countDocuments({ sender: other._id, receiver: userId, read: false });
      conversations.push({ user: { ...other.toObject(), id: other._id }, lastMessage: { ...msg.toObject(), id: msg._id }, unread });
    }
  }

  res.json(conversations);
};

// GET /api/messages/:userId
export const getMessages = async (req, res) => {
  const myId    = req.user._id;
  const otherId = req.params.userId;
  const { page = 1, limit = 30 } = req.query;

  const messages = await Message.find({
    $or: [
      { sender: myId,    receiver: otherId },
      { sender: otherId, receiver: myId    },
    ],
  })
    .sort({ createdAt: "asc" })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .populate("sender",   "id username name avatar")
    .populate("receiver", "id username name avatar");

  await Message.updateMany({ sender: otherId, receiver: myId, read: false }, { read: true });

  res.json(messages.map((m) => ({ ...m.toObject(), id: m._id })));
};

// POST /api/messages/:userId
export const sendMessage = async (req, res) => {
  const { text } = req.body;
  const receiverId = req.params.userId;

  if (!text?.trim()) return res.status(400).json({ message: "Message text required" });

  const isFollower = await Follow.findOne({
    $or: [
      { follower: req.user._id, following: receiverId },
      { follower: receiverId,   following: req.user._id },
    ],
  });
  if (!isFollower) return res.status(403).json({ message: "You can only message your followers" });

  const message = await Message.create({ text: text.trim(), sender: req.user._id, receiver: receiverId });
  await message.populate("sender receiver", "id username name avatar");

  res.status(201).json({ ...message.toObject(), id: message._id });
};

// GET /api/messages/followers
export const getMessageableUsers = async (req, res) => {
  const followers = await Follow.find({ following: req.user._id }).select("follower");
  const followerIds = followers.map((f) => f.follower);

  const users = await User.find({ _id: { $in: followerIds } }).select("id username name avatar bio");
  res.json(users.map((u) => ({ ...u.toObject(), id: u._id })));
};
