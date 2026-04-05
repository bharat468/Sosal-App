import Bookmark from "../models/Bookmark.js";
import Post from "../models/Post.js";

// POST /api/posts/:id/bookmark — toggle
export const toggleBookmark = async (req, res) => {
  const postId = req.params.id;
  const existing = await Bookmark.findOne({ user: req.user._id, post: postId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ saved: false });
  }
  await Bookmark.create({ user: req.user._id, post: postId });
  res.json({ saved: true });
};

// GET /api/bookmarks — my saved posts
export const getBookmarks = async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const bookmarks = await Bookmark.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .populate({ path: "post", populate: { path: "author", select: "id username name avatar" } });

  const posts = bookmarks
    .filter((b) => b.post)
    .map((b) => ({ ...b.post.toObject(), id: b.post._id }));

  const total = await Bookmark.countDocuments({ user: req.user._id });
  res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

// GET /api/posts/:id/bookmark/status
export const bookmarkStatus = async (req, res) => {
  const exists = await Bookmark.findOne({ user: req.user._id, post: req.params.id });
  res.json({ saved: !!exists });
};
