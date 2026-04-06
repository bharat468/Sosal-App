import fs from "fs";
import Story from "../models/Story.js";
import { deleteFromCloudinary, getPublicId } from "../utils/cloudinary.js";
import { uploadStreamToCloudinary } from "../middlewares/upload.js";

// POST /api/stories
export const createStory = async (req, res) => {
  try {
    const { caption, mediaUrl: bodyUrl, audioUrl, trackTitle } = req.body;
    let mediaUrl  = "";
    let mediaType = "image";

    if (req.file) {
      const result = await uploadStreamToCloudinary(
        req.file.buffer,
        req.file.mimetype,
        "sosal/stories"
      );
      mediaUrl  = result.url;
      mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    } else if (bodyUrl?.trim()) {
      mediaUrl  = bodyUrl.trim();
      const lower = mediaUrl.toLowerCase();
      mediaType = (lower.includes(".mp4") || lower.includes(".mov") || lower.includes(".webm")) ? "video" : "image";
    }

    if (!mediaUrl) return res.status(400).json({ message: "Media required for story" });

    const story = await Story.create({
      author: req.user._id, mediaUrl, mediaType,
      caption: caption || "",
      audioUrl: audioUrl || "",
      trackTitle: trackTitle || "",
    });
    await story.populate("author", "id username name avatar");
    res.status(201).json({ ...story.toObject(), id: story._id });
  } catch (err) {
    console.error("[createStory]", err.message);
    res.status(500).json({ message: "Failed to create story" });
  }
};

// GET /api/stories/feed
export const getStoryFeed = async (req, res) => {
  try {
    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 }).populate("author", "id username name avatar");

    const grouped = {};
    for (const s of stories) {
      const aid = s.author._id.toString();
      if (!grouped[aid]) {
        grouped[aid] = { user: { ...s.author.toObject(), id: s.author._id }, stories: [], hasUnread: false };
      }
      const viewed = s.viewers.map((v) => v.toString()).includes(req.user._id.toString());
      if (!viewed) grouped[aid].hasUnread = true;
      grouped[aid].stories.push({ ...s.toObject(), id: s._id, viewed });
    }

    const myId = req.user._id.toString();
    const result = Object.values(grouped).sort((a, b) => {
      if (a.user.id.toString() === myId) return -1;
      if (b.user.id.toString() === myId) return 1;
      return b.hasUnread - a.hasUnread;
    });

    res.json(result);
  } catch (err) {
    console.error("[getStoryFeed]", err.message);
    res.status(500).json({ message: "Failed to load stories" });
  }
};

// GET /api/stories/active-authors
export const getActiveStoryAuthors = async (_req, res) => {
  try {
    const authorIds = await Story.distinct("author", { expiresAt: { $gt: new Date() } });
    res.json(authorIds.map((id) => id.toString()));
  } catch {
    res.status(500).json({ message: "Failed to load active stories" });
  }
};

// POST /api/stories/:id/view
export const viewStory = async (req, res) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, { $addToSet: { viewers: req.user._id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark story as viewed" });
  }
};

// DELETE /api/stories/:id
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });
    if (story.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    // Delete from Cloudinary
    if (story.mediaUrl?.includes("cloudinary.com")) {
      const publicId = getPublicId(story.mediaUrl);
      const isVideo  = story.mediaUrl.includes("/video/");
      await deleteFromCloudinary(publicId, isVideo ? "video" : "image");
    }

    await story.deleteOne();
    res.json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete story" });
  }
};

// GET /api/stories/:id/viewers
export const getViewers = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate("viewers", "id username name avatar");
    if (!story) return res.status(404).json({ message: "Not found" });
    if (story.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    res.json(story.viewers.map((v) => ({ ...v.toObject(), id: v._id })));
  } catch (err) {
    res.status(500).json({ message: "Failed to load viewers" });
  }
};
