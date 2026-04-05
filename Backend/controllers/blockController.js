import Block from "../models/Block.js";
import Follow from "../models/Follow.js";

// POST /api/users/:id/block — toggle block
export const toggleBlock = async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user._id.toString())
    return res.status(400).json({ message: "Cannot block yourself" });

  const existing = await Block.findOne({ blocker: req.user._id, blocked: targetId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ blocked: false });
  }

  await Block.create({ blocker: req.user._id, blocked: targetId });
  // Also unfollow if following
  await Follow.deleteMany({
    $or: [
      { follower: req.user._id, following: targetId },
      { follower: targetId, following: req.user._id },
    ],
  });
  res.json({ blocked: true });
};

// GET /api/users/blocked — my blocked users
export const getBlocked = async (req, res) => {
  const blocks = await Block.find({ blocker: req.user._id })
    .populate("blocked", "id username name avatar");
  res.json(blocks.map((b) => ({ ...b.blocked.toObject(), id: b.blocked._id })));
};
