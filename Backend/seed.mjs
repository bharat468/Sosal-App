import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// ── Models ─────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: String, username: { type: String, unique: true },
  email: { type: String, unique: true }, password: String,
  googleId: { type: String, default: null, sparse: true },
  avatar: { type: String, default: "" }, bio: { type: String, default: "" },
  website: { type: String, default: "" }, isPrivate: { type: Boolean, default: false },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  caption: String, mediaUrl: { type: String, default: "" },
  mediaType: { type: String, default: "text" }, shares: { type: Number, default: 0 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const followSchema = new mongoose.Schema({
  follower:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  following: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
followSchema.index({ follower: 1, following: 1 }, { unique: true });

const User   = mongoose.model("User",   userSchema);
const Post   = mongoose.model("Post",   postSchema);
const Follow = mongoose.model("Follow", followSchema);

// ── Seed Data ──────────────────────────────────────────────
const users = [
  { name: "Arjun Sharma",   username: "arjun_sharma",   email: "arjun@example.com",   bio: "Photography lover 📸", avatar: "https://i.pravatar.cc/150?img=1" },
  { name: "Priya Patel",    username: "priya_patel",    email: "priya@example.com",   bio: "Travel & food 🌍",     avatar: "https://i.pravatar.cc/150?img=2" },
  { name: "Rahul Verma",    username: "rahul_verma",    email: "rahul@example.com",   bio: "Coder by day 💻",      avatar: "https://i.pravatar.cc/150?img=3" },
  { name: "Sneha Gupta",    username: "sneha_gupta",    email: "sneha@example.com",   bio: "Art & design ✨",      avatar: "https://i.pravatar.cc/150?img=4" },
  { name: "Vikram Singh",   username: "vikram_singh",   email: "vikram@example.com",  bio: "Fitness freak 💪",     avatar: "https://i.pravatar.cc/150?img=5" },
  { name: "Ananya Joshi",   username: "ananya_joshi",   email: "ananya@example.com",  bio: "Music is life 🎵",     avatar: "https://i.pravatar.cc/150?img=6" },
  { name: "Karan Mehta",    username: "karan_mehta",    email: "karan@example.com",   bio: "Entrepreneur 🚀",      avatar: "https://i.pravatar.cc/150?img=7" },
  { name: "Divya Nair",     username: "divya_nair",     email: "divya@example.com",   bio: "Book worm 📚",         avatar: "https://i.pravatar.cc/150?img=8" },
  { name: "Rohan Kapoor",   username: "rohan_kapoor",   email: "rohan@example.com",   bio: "Chef in making 🍳",    avatar: "https://i.pravatar.cc/150?img=9" },
  { name: "Meera Reddy",    username: "meera_reddy",    email: "meera@example.com",   bio: "Nature lover 🌿",      avatar: "https://i.pravatar.cc/150?img=10" },
];

const posts = [
  { caption: "Beautiful sunset today 🌅", mediaUrl: "https://picsum.photos/seed/post1/600/600", mediaType: "image" },
  { caption: "Morning coffee vibes ☕",    mediaUrl: "https://picsum.photos/seed/post2/600/600", mediaType: "image" },
  { caption: "Weekend hike done! 🏔️",     mediaUrl: "https://picsum.photos/seed/post3/600/600", mediaType: "image" },
  { caption: "New project launched 🚀",   mediaUrl: "https://picsum.photos/seed/post4/600/600", mediaType: "image" },
  { caption: "Homemade pasta 🍝",         mediaUrl: "https://picsum.photos/seed/post5/600/600", mediaType: "image" },
  { caption: "City lights at night 🌃",   mediaUrl: "https://picsum.photos/seed/post6/600/600", mediaType: "image" },
  { caption: "Reading this gem 📖",       mediaUrl: "https://picsum.photos/seed/post7/600/600", mediaType: "image" },
  { caption: "Gym session complete 💪",   mediaUrl: "https://picsum.photos/seed/post8/600/600", mediaType: "image" },
  { caption: "Beach day with friends 🏖️", mediaUrl: "https://picsum.photos/seed/post9/600/600", mediaType: "image" },
  { caption: "Just vibing 🎶",            mediaUrl: "https://picsum.photos/seed/post10/600/600", mediaType: "image" },
  { caption: "Coding late night 💻",      mediaUrl: "https://picsum.photos/seed/post11/600/600", mediaType: "image" },
  { caption: "Street food tour 🌮",       mediaUrl: "https://picsum.photos/seed/post12/600/600", mediaType: "image" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB");

  // Clear existing seed data
  await User.deleteMany({ email: { $in: users.map((u) => u.email) } });

  const password = await bcrypt.hash("password123", 10);

  // Create users
  const createdUsers = await User.insertMany(users.map((u) => ({ ...u, password, googleId: undefined })));
  console.log(`✅ Created ${createdUsers.length} users`);

  // Create posts — 1-2 posts per user
  const postDocs = [];
  for (let i = 0; i < createdUsers.length; i++) {
    const p1 = posts[i];
    const p2 = posts[(i + 5) % posts.length];
    postDocs.push({ ...p1, author: createdUsers[i]._id });
    postDocs.push({ ...p2, author: createdUsers[i]._id });
  }
  await Post.insertMany(postDocs);
  console.log(`✅ Created ${postDocs.length} posts`);

  // Create follows — each user follows next 3 users
  const followDocs = [];
  for (let i = 0; i < createdUsers.length; i++) {
    for (let j = 1; j <= 3; j++) {
      const followingIdx = (i + j) % createdUsers.length;
      followDocs.push({ follower: createdUsers[i]._id, following: createdUsers[followingIdx]._id });
    }
  }
  await Follow.insertMany(followDocs);
  console.log(`✅ Created ${followDocs.length} follows`);

  console.log("\n🎉 Seed complete! Login with any email, password: password123");
  console.log("Example: arjun@example.com / password123");

  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
