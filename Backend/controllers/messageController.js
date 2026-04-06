import Message from "../models/Message.js";
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
  if (receiverId?.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: "Cannot message yourself" });
  }

  const receiver = await User.findById(receiverId).select("isPrivate");
  if (!receiver) return res.status(404).json({ message: "User not found" });

  // Private account => not messageable from this flow.
  if (receiver.isPrivate) {
    return res.status(403).json({ message: "This account is private. Messaging is disabled." });
  }

  const message = await Message.create({ text: text.trim(), sender: req.user._id, receiver: receiverId });
  await message.populate("sender receiver", "id username name avatar");

  res.status(201).json({ ...message.toObject(), id: message._id });
};

// GET /api/messages/followers
export const getMessageableUsers = async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id },
    isPrivate: { $ne: true },
  }).select("id username name avatar bio isPrivate");

  res.json(users.map((u) => ({ ...u.toObject(), id: u._id })));
};
