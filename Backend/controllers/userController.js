import bcrypt from "bcrypt";
import fs from "fs";
import User from "../models/User.js";
import Follow from "../models/Follow.js";
import FollowRequest from "../models/FollowRequest.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js";
import { deleteFromCloudinary, getPublicId } from "../utils/cloudinary.js";
import { uploadStreamToCloudinary } from "../middlewares/upload.js";
import { createOrReplaceNotification, emitNotif, emitNotificationRefresh, removeNotification } from "../utils/notificationHelpers.js";

const safe = (u) => { const obj = u.toObject ? u.toObject() : u; const { password, ...rest } = obj; return { ...rest, id: u._id }; };

// GET /api/users/:username
export const getProfile = async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).json({ message: "User not found" });

  const myId = req.user._id.toString();
  const userId = user._id.toString();

  // Check if viewer is following
  const isFollowing = await Follow.findOne({ follower: myId, following: userId });
  const isOwn = myId === userId;

  // Private account — only show full profile if following or own
  if (user.isPrivate && !isOwn && !isFollowing) {
    const [followers, following, posts] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
      Post.countDocuments({ author: user._id }),
    ]);
    // Check pending request
    const pendingReq = await FollowRequest.findOne({ sender: myId, recipient: userId });
    return res.json({
      ...safe(user),
      isPrivate: true,
      isLocked: true,
      followStatus: pendingReq ? "requested" : "none",
      _count: { followers, following, posts },
    });
  }

  const [followers, following, posts] = await Promise.all([
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
    Post.countDocuments({ author: user._id }),
  ]);

  // Check pending request
  const pendingReq = await FollowRequest.findOne({ sender: myId, recipient: userId });

  res.json({
    ...safe(user),
    isLocked: false,
    followStatus: isFollowing ? "following" : pendingReq ? "requested" : "none",
    _count: { followers, following, posts },
  });
};

// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, username, bio, website, isPrivate } = req.body;
    const data = {};
    if (name)                data.name      = name;
    if (bio !== undefined)   data.bio       = bio;
    if (website !== undefined) data.website = website;
    if (isPrivate !== undefined) data.isPrivate = isPrivate === "true" || isPrivate === true;
    if (req.file) {
      if (req.user.avatar && req.user.avatar.includes("cloudinary.com")) {
        const oldPublicId = getPublicId(req.user.avatar);
        await deleteFromCloudinary(oldPublicId, "image");
      }
      const result = await uploadStreamToCloudinary(
        req.file.buffer,
        req.file.mimetype,
        "sosal/avatars"
      );
      data.avatar = result.url;
    }
    if (username && username !== req.user.username) {
      const ex = await User.findOne({ username });
      if (ex) return res.status(409).json({ message: "Username already taken" });
      data.username = username;
    }
    const user = await User.findByIdAndUpdate(req.user._id, data, { new: true });
    res.json(safe(user));
  } catch (err) {
    console.error("[updateProfile]", err.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// PUT /api/users/password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Both fields required" });

  const user  = await User.findById(req.user._id);
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(401).json({ message: "Current password incorrect" });

  const hashed = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(req.user._id, { password: hashed }, { new: true });
  res.json({ message: "Password updated" });
};

// POST /api/users/:id/follow
export const followUser = async (req, res) => {
  const targetId = req.params.id;

  // Validate ObjectId
  if (!targetId || targetId === "undefined" || targetId.length !== 24) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (targetId === req.user._id.toString())
    return res.status(400).json({ message: "Cannot follow yourself" });

  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ message: "User not found" });

  // Already following → unfollow
  const alreadyFollowing = await Follow.findOne({ follower: req.user._id, following: targetId });
  if (alreadyFollowing) {
    await alreadyFollowing.deleteOne();
    await removeNotification({ type: "follow", recipient: targetId, sender: req.user._id });
    await emitNotificationRefresh(targetId);
    const count = await Follow.countDocuments({ following: targetId });
    return res.json({ status: "unfollowed", following: false, followerCount: count });
  }

  // Pending request → cancel
  const pendingRequest = await FollowRequest.findOne({ sender: req.user._id, recipient: targetId });
  if (pendingRequest) {
    await pendingRequest.deleteOne();
    // Remove the follow_request notification
    await Notification.deleteOne({ type: "follow_request", recipient: targetId, sender: req.user._id });
    return res.json({ status: "request_cancelled", following: false, requested: false });
  }

  // Private account → send request
  if (target.isPrivate) {
    await FollowRequest.create({ sender: req.user._id, recipient: targetId });
    const notif = await createOrReplaceNotification(
      { type: "follow_request", recipient: targetId, sender: req.user._id, read: false },
      [{ path: "sender", select: "id username name avatar" }]
    );
    // Socket emit to recipient
    await emitNotif(targetId, { ...notif.toObject(), id: notif._id });
    return res.json({ status: "requested", following: false, requested: true });
  }

  // Public account → follow directly
  await Follow.create({ follower: req.user._id, following: targetId });
  const notif = await createOrReplaceNotification(
    { type: "follow", recipient: targetId, sender: req.user._id, read: false },
    [{ path: "sender", select: "id username name avatar" }]
  );
  // Socket emit to recipient
  await emitNotif(targetId, { ...notif.toObject(), id: notif._id });

  const count = await Follow.countDocuments({ following: targetId });
  res.json({ status: "followed", following: true, requested: false, followerCount: count });
};

// POST /api/users/requests/:requestId/accept
export const acceptFollowRequest = async (req, res) => {
  const request = await FollowRequest.findById(req.params.requestId);
  if (!request || request.recipient.toString() !== req.user._id.toString())
    return res.status(404).json({ message: "Request not found" });

  await Follow.create({ follower: request.sender, following: req.user._id });
  await request.deleteOne();

  const notif = await createOrReplaceNotification(
    { type: "follow_accepted", recipient: request.sender, sender: req.user._id, read: false },
    [{ path: "sender", select: "id username name avatar" }]
  );
  await emitNotif(request.sender, { ...notif.toObject(), id: notif._id });

  res.json({ message: "Request accepted" });
};

// POST /api/users/requests/:requestId/reject
export const rejectFollowRequest = async (req, res) => {
  const request = await FollowRequest.findById(req.params.requestId);
  if (!request || request.recipient.toString() !== req.user._id.toString())
    return res.status(404).json({ message: "Request not found" });

  await request.deleteOne();
  res.json({ message: "Request rejected" });
};

// GET /api/users/requests
export const getFollowRequests = async (req, res) => {
  const requests = await FollowRequest.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .populate("sender", "id username name avatar");
  res.json(requests.map((r) => ({ ...r.toObject(), id: r._id })));
};

// GET /api/users/search?q=
export const searchUsers = async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  if (!q) return res.status(400).json({ message: "Query required" });

  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { username: { $regex: q, $options: "i" } },
      { name:     { $regex: q, $options: "i" } },
    ],
  }).select("id username name avatar bio isPrivate").skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));

  const usersWithCount = await Promise.all(users.map(async (u) => ({
    ...u.toObject(), id: u._id,
    _count: { followers: await Follow.countDocuments({ following: u._id }) },
  })));

  res.json(usersWithCount);
};

// GET /api/users/:id/followers
export const getFollowers = async (req, res) => {
  const [rows, myFollowing, myPendingRequests] = await Promise.all([
    Follow.find({ following: req.params.id }).populate("follower", "id username name avatar"),
    Follow.find({ follower: req.user._id }).select("following"),
    FollowRequest.find({ sender: req.user._id }).select("recipient"),
  ]);

  const followingIds = new Set(myFollowing.map((f) => f.following.toString()));
  const requestedIds = new Set(myPendingRequests.map((r) => r.recipient.toString()));

  res.json(rows.map((r) => {
    const uid = r.follower._id.toString();
    return {
      ...r.follower.toObject(),
      id: r.follower._id,
      followStatus: followingIds.has(uid) ? "following" : requestedIds.has(uid) ? "requested" : "none",
    };
  }));
};

// POST /api/users/:id/share
export const shareProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { profileShares: 1 } },
      { new: true }
    ).select("username profileShares");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Profile share recorded",
      user: { ...safe(user), profileShares: user.profileShares },
    });
  } catch (err) {
    console.error("[shareProfile]", err.message);
    res.status(500).json({ message: "Failed to share profile" });
  }
};

// GET /api/users/:id/following
export const getFollowing = async (req, res) => {
  const [rows, myFollowing, myPendingRequests] = await Promise.all([
    Follow.find({ follower: req.params.id }).populate("following", "id username name avatar"),
    Follow.find({ follower: req.user._id }).select("following"),
    FollowRequest.find({ sender: req.user._id }).select("recipient"),
  ]);

  const followingIds = new Set(myFollowing.map((f) => f.following.toString()));
  const requestedIds = new Set(myPendingRequests.map((r) => r.recipient.toString()));

  res.json(rows.map((r) => {
    const uid = r.following._id.toString();
    return {
      ...r.following.toObject(),
      id: r.following._id,
      followStatus: followingIds.has(uid) ? "following" : requestedIds.has(uid) ? "requested" : "none",
    };
  }));
};

// GET /api/users/suggestions
export const getSuggestions = async (req, res) => {
  const [myFollowing, myPendingRequests] = await Promise.all([
    Follow.find({ follower: req.user._id }).select("following"),
    FollowRequest.find({ sender: req.user._id }).select("recipient"),
  ]);

  const followingIds = new Set(myFollowing.map((f) => f.following.toString()));
  const requestedIds = new Set(myPendingRequests.map((r) => r.recipient.toString()));

  const users = await User.find({ _id: { $ne: req.user._id } })
    .select("id username name avatar bio isPrivate")
    .limit(10);

  const usersWithCount = await Promise.all(users.map(async (u) => ({
    ...u.toObject(), id: u._id,
    followStatus: followingIds.has(u._id.toString())
      ? "following"
      : requestedIds.has(u._id.toString())
        ? "requested"
        : "none",
    _count: { followers: await Follow.countDocuments({ following: u._id }) },
  })));

  res.json(usersWithCount);
};
