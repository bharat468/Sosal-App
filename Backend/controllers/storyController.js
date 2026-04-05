import Story from "../models/Story.js";
import Follow from "../models/Follow.js";
import User  from "../models/User.js";

const getBaseUrl = () => process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;

// POST /api/stories — create story
export const createStory = async (req, res) => {
  const { caption, mediaUrl: bodyUrl } = req.body;
  let mediaUrl  = "";
  let mediaType = "image";

  if (req.file) {
    mediaUrl  = `${getBaseUrl()}/uploads/${req.file.filename}`;
    mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
  } else if (bodyUrl?.trim()) {
    mediaUrl  = bodyUrl.trim();
    const lower = mediaUrl.toLowerCase();
    mediaType = (lower.includes(".mp4") || lower.includes(".mov") || lower.includes(".webm")) ? "video" : "image";
  }

  if (!mediaUrl) return res.status(400).json({ message: "Media required for story" });

  const story = await Story.create({ author: req.user._id, mediaUrl, mediaType, caption: caption || "" });
  await story.populate("author", "id username name avatar");
  res.status(201).json({ ...story.toObject(), id: story._id });
};

// GET /api/stories/feed — stories from following + own
export const getStoryFeed = async (req, res) => {
  const following = await Follow.find({ follower: req.user._id }).select("following");
  const ids = [req.user._id, ...following.map((f) => f.following)];

  const stories = await Story.find({
    author: { $in: ids },
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .populate("author", "id username name avatar");

  // Group by author
  const grouped = {};
  for (const s of stories) {
    const aid = s.author._id.toString();
    if (!grouped[aid]) {
      grouped[aid] = {
        user: { ...s.author.toObject(), id: s.author._id },
        stories: [],
        hasUnread: false,
      };
    }
    const viewed = s.viewers.map((v) => v.toString()).includes(req.user._id.toString());
    if (!viewed) grouped[aid].hasUnread = true;
    grouped[aid].stories.push({ ...s.toObject(), id: s._id, viewed });
  }

  // Own stories first
  const myId = req.user._id.toString();
  const result = Object.values(grouped).sort((a, b) => {
    if (a.user.id.toString() === myId) return -1;
    if (b.user.id.toString() === myId) return 1;
    return b.hasUnread - a.hasUnread;
  });

  res.json(result);
};

// POST /api/stories/:id/view — mark as viewed
export const viewStory = async (req, res) => {
  await Story.findByIdAndUpdate(req.params.id, {
    $addToSet: { viewers: req.user._id },
  });
  res.json({ ok: true });
};

// DELETE /api/stories/:id
export const deleteStory = async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ message: "Story not found" });
  if (story.author.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not authorized" });
  await story.deleteOne();
  res.json({ message: "Story deleted" });
};

// GET /api/stories/:id/viewers
export const getViewers = async (req, res) => {
  const story = await Story.findById(req.params.id).populate("viewers", "id username name avatar");
  if (!story) return res.status(404).json({ message: "Not found" });
  if (story.author.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not authorized" });
  res.json(story.viewers.map((v) => ({ ...v.toObject(), id: v._id })));
};
