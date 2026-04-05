import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Joi from "joi";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const JWT_SECRET  = process.env.JWT_SECRET || "changeme";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sign    = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
const safeUser = (u) => ({ id: u._id, _id: u._id, name: u.name, username: u.username, email: u.email, avatar: u.avatar, bio: u.bio, role: u.role || "user" });

// POST /api/auth/register
export const register = async (req, res) => {
  const schema = Joi.object({
    name:     Joi.string().min(2).max(50).required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, username, email, password } = req.body;

  const [emailEx, userEx] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ username }),
  ]);
  if (emailEx) return res.status(409).json({ message: "Email already registered" });
  if (userEx)  return res.status(409).json({ message: "Username already taken" });

  const hashed = await bcrypt.hash(password, 12);
  const user   = await User.create({ name, username, email, password: hashed });

  res.status(201).json({ token: sign(user._id), user: safeUser(user) });
};

// POST /api/auth/login
export const login = async (req, res) => {
  const schema = Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user)          return res.status(401).json({ message: "Invalid credentials" });
  if (!user.password) return res.status(401).json({ message: "Please sign in with Google" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  res.json({ token: sign(user._id), user: safeUser(user) });
};

// POST /api/auth/google
export const googleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: "Google credential required" });

  try {
    const ticket  = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId || !user.avatar) {
        user.googleId = user.googleId || googleId;
        user.avatar   = user.avatar   || picture || "";
        await user.save();
      }
    } else {
      const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      let username = baseUsername;
      let counter  = 1;
      while (await User.findOne({ username })) username = `${baseUsername}${counter++}`;

      user = await User.create({ name: name || username, username, email, googleId, avatar: picture || "", password: null });
    }

    res.json({ token: sign(user._id), user: safeUser(user) });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ message: "Google authentication failed" });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  const Follow = (await import("../models/Follow.js")).default;
  const Post   = (await import("../models/Post.js")).default;

  const [followers, following, posts] = await Promise.all([
    Follow.countDocuments({ following: req.user._id }),
    Follow.countDocuments({ follower:  req.user._id }),
    Post.countDocuments({ author: req.user._id }),
  ]);

  const { password, ...safe } = req.user.toObject();
  res.json({ ...safe, id: req.user._id, _id: req.user._id, role: req.user.role || "user", _count: { followers, following, posts } });
};
