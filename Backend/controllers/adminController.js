import User from "../models/User.js";
import Post from "../models/Post.js";
import Like from "../models/Like.js";
import Comment from "../models/Comment.js";
import Follow from "../models/Follow.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Report from "../models/Report.js";

// GET /api/admin/stats
export const getStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [users, posts, likes, comments, follows, messages, newUsersToday, newPostsToday, recentUsers] =
    await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Like.countDocuments(),
      Comment.countDocuments(),
      Follow.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      Post.countDocuments({ createdAt: { $gte: today } }),
      User.find().sort({ createdAt: -1 }).limit(5).select("username name email avatar createdAt"),
    ]);

  res.json({ users, posts, likes, comments, follows, messages, newUsersToday, newPostsToday, recentUsers });
};

// GET /api/admin/users
export const getUsers = async (req, res) => {
  const { page = 1, limit = 20, q = "" } = req.query;
  const filter = q ? {
    $or: [
      { username: { $regex: q, $options: "i" } },
      { email:    { $regex: q, $options: "i" } },
      { name:     { $regex: q, $options: "i" } },
    ],
  } : {};

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select("username name email avatar createdAt isBanned isPrivate"),
    User.countDocuments(filter),
  ]);

  // Add post/follower counts
  const enriched = await Promise.all(users.map(async (u) => {
    const [postCount, followerCount] = await Promise.all([
      Post.countDocuments({ author: u._id }),
      Follow.countDocuments({ following: u._id }),
    ]);
    return { ...u.toObject(), id: u._id, postCount, followerCount };
  }));

  res.json({ users: enriched, total, page: parseInt(page) });
};

// PUT /api/admin/users/:id — ban/unban
export const updateUser = async (req, res) => {
  const { isBanned } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBanned },
    { new: true }
  ).select("username isBanned");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ ...user.toObject(), id: user._id });
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  // Delete all user data
  await Promise.all([
    Post.deleteMany({ author: user._id }),
    Follow.deleteMany({ $or: [{ follower: user._id }, { following: user._id }] }),
    Notification.deleteMany({ $or: [{ sender: user._id }, { recipient: user._id }] }),
    Message.deleteMany({ $or: [{ sender: user._id }, { receiver: user._id }] }),
    user.deleteOne(),
  ]);
  res.json({ message: "User deleted" });
};

// GET /api/admin/posts
export const getPosts = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const [posts, total] = await Promise.all([
    Post.find().sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("author", "username avatar"),
    Post.countDocuments(),
  ]);

  const enriched = await Promise.all(posts.map(async (p) => {
    const [likeCount, commentCount] = await Promise.all([
      Like.countDocuments({ post: p._id }),
      Comment.countDocuments({ post: p._id }),
    ]);
    return { ...p.toObject(), id: p._id, likeCount, commentCount };
  }));

  res.json({ posts: enriched, total, page: parseInt(page) });
};

// DELETE /api/admin/posts/:id
export const deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  await Promise.all([
    Like.deleteMany({ post: post._id }),
    Comment.deleteMany({ post: post._id }),
    Notification.deleteMany({ post: post._id }),
    post.deleteOne(),
  ]);
  res.json({ message: "Post deleted" });
};

// GET /api/admin/reports
export const getReports = async (req, res) => {
  const { page = 1, limit = 20, status = "" } = req.query;
  const filter = status ? { status } : {};

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("reporter", "id username name avatar")
      .populate("reportedUser", "id username name avatar isBanned"),
    Report.countDocuments(filter),
  ]);

  res.json({
    reports: reports.map((report) => ({ ...report.toObject(), id: report._id })),
    total,
    page: parseInt(page),
  });
};

// PUT /api/admin/reports/:id
export const updateReport = async (req, res) => {
  const { status, adminNote = "" } = req.body;
  if (!["pending", "in_review", "resolved", "dismissed"].includes(status)) {
    return res.status(400).json({ message: "Invalid report status" });
  }

  const report = await Report.findByIdAndUpdate(
    req.params.id,
    {
      status,
      adminNote: String(adminNote).trim(),
      reviewedAt: ["resolved", "dismissed"].includes(status) ? new Date() : null,
    },
    { new: true }
  )
    .populate("reporter", "id username name avatar")
    .populate("reportedUser", "id username name avatar isBanned");

  if (!report) return res.status(404).json({ message: "Report not found" });

  res.json({ ...report.toObject(), id: report._id });
};
