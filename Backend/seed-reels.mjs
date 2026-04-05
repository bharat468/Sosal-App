/**
 * Seed demo reels using free Cloudinary sample videos
 * Run: node seed-reels.mjs
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

await mongoose.connect(process.env.MONGO_URL);
console.log("Connected");

const User = mongoose.model("User", new mongoose.Schema({
  username: String, name: String, email: String, password: String, avatar: String,
}, { strict: false }), "users");

const Post = mongoose.model("Post", new mongoose.Schema({
  caption: String, mediaUrl: String, mediaType: String,
  shares: { type: Number, default: 0 }, hashtags: [String],
  author: mongoose.Schema.Types.ObjectId,
}, { strict: false, timestamps: true }), "posts");

// Get first user to assign posts to
const user = await User.findOne({ username: "bharatpareek256" }) || await User.findOne();
if (!user) { console.error("No user found"); process.exit(1); }

// Free sample videos from Cloudinary demo account
const demoVideos = [
  {
    mediaUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
    caption: "Cute dog playing 🐕 #pets #cute",
  },
  {
    mediaUrl: "https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4",
    caption: "Sea turtle swimming 🐢 #ocean #nature",
  },
  {
    mediaUrl: "https://res.cloudinary.com/demo/video/upload/elephants.mp4",
    caption: "Elephants in the wild 🐘 #wildlife #nature",
  },
];

// Delete old empty video posts
await Post.deleteMany({ mediaType: "video", mediaUrl: "" });
console.log("Cleared empty video posts");

// Add demo reels
for (const v of demoVideos) {
  const existing = await Post.findOne({ mediaUrl: v.mediaUrl });
  if (existing) { console.log("Already exists:", v.caption); continue; }

  await Post.create({
    ...v,
    mediaType: "video",
    author: user._id,
    hashtags: (v.caption.match(/#\w+/g) || []).map(t => t.toLowerCase()),
  });
  console.log("✅ Added:", v.caption);
}

console.log("\nDone! Reels seeded.");
await mongoose.disconnect();
