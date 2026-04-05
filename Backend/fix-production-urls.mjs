/**
 * Run this ONCE after deploying to fix localhost URLs in database
 * Usage: node fix-production-urls.mjs
 */
import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URL);
console.log("Connected to MongoDB");

const Post = mongoose.model("Post", new mongoose.Schema({
  mediaUrl: String, mediaType: String, author: mongoose.Schema.Types.ObjectId, caption: String,
}, { strict: false, timestamps: true }), "posts");

const User = mongoose.model("User", new mongoose.Schema({
  avatar: String, username: String,
}, { strict: false }), "users");

// Fix posts with localhost URLs — replace with picsum for images, remove for videos
const posts = await Post.find({ mediaUrl: { $regex: "localhost" } });
console.log(`Found ${posts.length} posts with localhost URLs`);

for (let i = 0; i < posts.length; i++) {
  const p = posts[i];
  if (p.mediaType === "video") {
    // Videos can't be served from localhost — clear them
    await Post.findByIdAndUpdate(p._id, { mediaUrl: "", mediaType: "text" });
    console.log(`Cleared video post: ${p._id}`);
  } else {
    // Replace image with picsum placeholder
    const newUrl = `https://picsum.photos/seed/prod${i}/600/600`;
    await Post.findByIdAndUpdate(p._id, { mediaUrl: newUrl });
    console.log(`Fixed image post: ${p._id} → ${newUrl}`);
  }
}

// Fix user avatars with localhost URLs
const users = await User.find({ avatar: { $regex: "localhost" } });
console.log(`Found ${users.length} users with localhost avatars`);

for (const u of users) {
  const newAvatar = `https://i.pravatar.cc/150?u=${u._id}`;
  await User.findByIdAndUpdate(u._id, { avatar: newAvatar });
  console.log(`Fixed avatar: ${u.username} → ${newAvatar}`);
}

console.log("✅ All localhost URLs fixed!");
await mongoose.disconnect();
