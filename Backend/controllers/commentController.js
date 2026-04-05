import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";

const emitNotif = async (recipientId, payload) => {
  try {
    const { io, onlineUsers } = await import("../index.js");
    const socketId = onlineUsers.get(recipientId.toString());
    if (socketId) io.to(socketId).emit("notification", payload);
  } catch {}
};

// POST /api/posts/:id/comments
export const addComment = async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: "Comment text required" });

  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const comment = await Comment.create({ text: text.trim(), post: post._id, author: req.user._id });
  await comment.populate("author", "id username name avatar");

  if (post.author.toString() !== req.user._id.toString()) {
    const notif = await Notification.create({
      type: "comment", recipient: post.author, sender: req.user._id,
      post: post._id, comment: comment._id,
    });
    await notif.populate("sender", "id username name avatar");
    await notif.populate("post", "id mediaUrl caption");
    await emitNotif(post.author, { ...notif.toObject(), id: notif._id });
  }

  res.status(201).json({ ...comment.toObject(), id: comment._id });
};

// GET /api/posts/:id/comments
export const getComments = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const [comments, total] = await Promise.all([
    Comment.find({ post: req.params.id })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("author", "id username name avatar"),
    Comment.countDocuments({ post: req.params.id }),
  ]);

  res.json({ comments: comments.map((c) => ({ ...c.toObject(), id: c._id })), total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

// DELETE /api/comments/:id
export const deleteComment = async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const post = await Post.findById(comment.post);
  const isCommentAuthor = comment.author.toString() === req.user._id.toString();
  const isPostAuthor    = post?.author.toString() === req.user._id.toString();

  if (!isCommentAuthor && !isPostAuthor)
    return res.status(403).json({ message: "Not authorized" });

  await comment.deleteOne();
  res.json({ message: "Comment deleted" });
};
