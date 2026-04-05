import path from "path";
import { fileURLToPath } from "url";
import Post from "../models/Post.js";
import Like from "../models/Like.js";
import Follow from "../models/Follow.js";
import Notification from "../models/Notification.js";
import { uploadToCloudinary, deleteFromCloudinary, getPublicId } from "../utils/cloudinary.js";
import { uploadStreamToCloudinary } from "../middlewares/upload.js";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));

const emitNotif = async (recipientId, payload) => {
  try {
    const { io, onlineUsers } = await import("../index.js");
    const socketId = onlineUsers.get(recipientId.toString());
    if (socketId) io.to(socketId).emit("notification", payload);
  } catch {}
};

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const parsePage = (val, def = 1)  => Math.max(1, parseInt(val) || def);
const parseLimit = (val, def = 10) => Math.min(50, Math.max(1, parseInt(val) || def));

const getLikesAndComments = async (postIds, userId) => {
  const Comment = (await import("../models/Comment.js")).default;
  const [likeCounts, userLikes, commentCounts] = await Promise.all([
    Like.aggregate([{ $match: { post: { $in: postIds } } }, { $group: { _id: "$post", count: { $sum: 1 } } }]),
    Like.find({ user: userId, post: { $in: postIds } }).select("post"),
    Comment.aggregate([{ $match: { post: { $in: postIds } } }, { $group: { _id: "$post", count: { $sum: 1 } } }]),
  ]);
  const likeMap    = Object.fromEntries(likeCounts.map((l) => [l._id.toString(), l.count]));
  const likedSet   = new Set(userLikes.map((l) => l.post.toString()));
  const commentMap = Object.fromEntries(commentCounts.map((c) => [c._id.toString(), c.count]));
  return { likeMap, likedSet, commentMap };
};

// Delete media from Cloudinary only
const deleteMedia = async (mediaUrl) => {
  if (!mediaUrl) return;
  if (mediaUrl.includes("cloudinary.com")) {
    const publicId = getPublicId(mediaUrl);
    const isVideo  = mediaUrl.includes("/video/");
    await deleteFromCloudinary(publicId, isVideo ? "video" : "image");
  }
  // Local files: no-op (ephemeral on Render anyway)
};

// POST /api/posts
export const createPost = async (req, res) => {
  try {
    const { caption, mediaUrl: bodyMediaUrl, audioUrl, trackTitle } = req.body;
    let mediaUrl  = "";
    let mediaType = "text";

    if (req.file) {
      // Upload directly from memory buffer to Cloudinary
      const result = await uploadStreamToCloudinary(
        req.file.buffer,
        req.file.mimetype,
        "sosal/posts"
      );
      mediaUrl  = result.url;
      mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    } else if (bodyMediaUrl?.trim()) {
      mediaUrl  = bodyMediaUrl.trim();
      const lower = mediaUrl.toLowerCase();
      mediaType = (lower.includes(".mp4") || lower.includes(".mov") || lower.includes(".webm") || lower.includes("video")) ? "video" : "image";
    }

    if (!caption?.trim() && !mediaUrl)
      return res.status(400).json({ message: "Caption or media required" });

    const hashtags = caption ? [...new Set((caption.match(/#\w+/g) || []).map(t => t.toLowerCase()))] : [];

    const post = await Post.create({
      caption: caption?.trim() || "",
      mediaUrl, mediaType, hashtags,
      audioUrl: audioUrl || "",
      trackTitle: trackTitle || "",
      author: req.user._id,
    });
    await post.populate("author", "id username name avatar");
    res.status(201).json({ ...post.toObject(), id: post._id, _count: { likes: 0, comments: 0 } });
  } catch (err) {
    console.error("[createPost]", err.message);
    res.status(500).json({ message: "Failed to create post" });
  }
};

// GET /api/posts/feed
export const getFeed = async (req, res) => {
  try {
    const page  = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    const skip  = (page - 1) * limit;

    const following    = await Follow.find({ follower: req.user._id }).select("following");
    const followingIds = following.map((f) => f.following);

    const [followingPosts, otherPosts] = await Promise.all([
      Post.find({ author: { $in: followingIds } }).sort({ createdAt: -1 }).limit(100).populate("author", "id username name avatar"),
      Post.find({ author: { $nin: [...followingIds, req.user._id] } }).sort({ createdAt: -1 }).limit(100).populate("author", "id username name avatar"),
    ]);

    const allPosts  = [...shuffle(followingPosts), ...shuffle(otherPosts)];
    const total     = allPosts.length;
    const paginated = allPosts.slice(skip, skip + limit);
    const postIds   = paginated.map((p) => p._id);

    const { likeMap, likedSet, commentMap } = await getLikesAndComments(postIds, req.user._id);

    res.json({
      posts: paginated.map((p) => ({
        ...p.toObject(), id: p._id,
        liked: likedSet.has(p._id.toString()),
        _count: { likes: likeMap[p._id.toString()] || 0, comments: commentMap[p._id.toString()] || 0 },
      })),
      total, page, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[getFeed]", err.message);
    res.status(500).json({ message: "Failed to load feed" });
  }
};

// GET /api/posts/reels
export const getReels = async (req, res) => {
  try {
    const page  = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit, 5);

    const allVideos = await Post.find({ mediaType: "video", mediaUrl: { $ne: "" } })
      .populate("author", "id username name avatar");
    shuffle(allVideos);

    const total     = allVideos.length;
    const paginated = allVideos.slice((page - 1) * limit, page * limit);
    const postIds   = paginated.map((p) => p._id);

    const { likeMap, likedSet, commentMap } = await getLikesAndComments(postIds, req.user._id);

    res.json({
      posts: paginated.map((p) => ({
        ...p.toObject(), id: p._id,
        liked: likedSet.has(p._id.toString()),
        _count: { likes: likeMap[p._id.toString()] || 0, comments: commentMap[p._id.toString()] || 0 },
      })),
      total, page, pages: Math.ceil(total / limit), hasMore: page < Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[getReels]", err.message);
    res.status(500).json({ message: "Failed to load reels" });
  }
};

// GET /api/posts/:id
export const getPost = async (req, res) => {
  try {
    const Comment = (await import("../models/Comment.js")).default;
    if (!req.params.id || req.params.id === "undefined" || req.params.id.length !== 24)
      return res.status(400).json({ message: "Invalid post ID" });

    const post = await Post.findById(req.params.id).populate("author", "id username name avatar");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const [likeCount, liked, comments] = await Promise.all([
      Like.countDocuments({ post: post._id }),
      Like.findOne({ user: req.user._id, post: post._id }),
      Comment.find({ post: post._id }).sort({ createdAt: -1 }).limit(20).populate("author", "id username name avatar"),
    ]);

    res.json({ ...post.toObject(), id: post._id, liked: !!liked, _count: { likes: likeCount, comments: comments.length }, comments });
  } catch (err) {
    console.error("[getPost]", err.message);
    res.status(500).json({ message: "Failed to load post" });
  }
};

// GET /api/posts/user/:userId
export const getUserPosts = async (req, res) => {
  try {
    const page  = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit, 12);

    const [posts, total] = await Promise.all([
      Post.find({ author: req.params.userId }).sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(limit)
        .populate("author", "id username name avatar"),
      Post.countDocuments({ author: req.params.userId }),
    ]);

    const postIds = posts.map((p) => p._id);
    const { likeMap, likedSet, commentMap } = await getLikesAndComments(postIds, req.user._id);

    res.json({
      posts: posts.map((p) => ({
        ...p.toObject(), id: p._id,
        liked: likedSet.has(p._id.toString()),
        _count: { likes: likeMap[p._id.toString()] || 0, comments: commentMap[p._id.toString()] || 0 },
      })),
      total, page, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[getUserPosts]", err.message);
    res.status(500).json({ message: "Failed to load posts" });
  }
};

// PUT /api/posts/:id
export const editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const data = {};
    if (req.body.caption !== undefined) data.caption = req.body.caption;

    if (req.file) {
      await deleteMedia(post.mediaUrl);
      const result = await uploadStreamToCloudinary(
        req.file.buffer,
        req.file.mimetype,
        "sosal/posts"
      );
      data.mediaUrl  = result.url;
      data.mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }

    const updated = await Post.findByIdAndUpdate(post._id, data, { new: true })
      .populate("author", "id username name avatar");
    res.json({ ...updated.toObject(), id: updated._id });
  } catch (err) {
    console.error("[editPost]", err.message);
    res.status(500).json({ message: "Failed to edit post" });
  }
};

// DELETE /api/posts/:id
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    await deleteMedia(post.mediaUrl);
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("[deletePost]", err.message);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

// POST /api/posts/:id/like
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const existing = await Like.findOne({ user: req.user._id, post: post._id });
    if (existing) {
      await existing.deleteOne();
      const count = await Like.countDocuments({ post: post._id });
      return res.json({ liked: false, likes: count });
    }

    await Like.create({ user: req.user._id, post: post._id });
    if (post.author.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({ type: "like", recipient: post.author, sender: req.user._id, post: post._id });
      await notif.populate("sender", "id username name avatar");
      await notif.populate("post", "id mediaUrl caption");
      await emitNotif(post.author, { ...notif.toObject(), id: notif._id });
    }

    const count = await Like.countDocuments({ post: post._id });
    res.json({ liked: true, likes: count });
  } catch (err) {
    console.error("[likePost]", err.message);
    res.status(500).json({ message: "Failed to like post" });
  }
};

// POST /api/posts/:id/share
export const sharePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ shares: post.shares });
  } catch (err) {
    res.status(500).json({ message: "Failed to share post" });
  }
};

// GET /api/posts/hashtag/:tag
export const getByHashtag = async (req, res) => {
  try {
    const tag   = req.params.tag.toLowerCase().replace(/^#/, "");
    const page  = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit, 12);

    const [posts, total] = await Promise.all([
      Post.find({ hashtags: tag }).sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(limit)
        .populate("author", "id username name avatar"),
      Post.countDocuments({ hashtags: tag }),
    ]);

    const postIds = posts.map((p) => p._id);
    const { likeMap, likedSet, commentMap } = await getLikesAndComments(postIds, req.user._id);

    res.json({
      posts: posts.map((p) => ({
        ...p.toObject(), id: p._id,
        liked: likedSet.has(p._id.toString()),
        _count: { likes: likeMap[p._id.toString()] || 0, comments: commentMap[p._id.toString()] || 0 },
      })),
      total, page, pages: Math.ceil(total / limit), tag,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load hashtag posts" });
  }
};

// GET /api/posts/trending-hashtags
export const getTrendingHashtags = async (req, res) => {
  try {
    const result = await Post.aggregate([
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.json(result.map((r) => ({ tag: r._id, count: r.count })));
  } catch (err) {
    res.status(500).json({ message: "Failed to load trending hashtags" });
  }
};
