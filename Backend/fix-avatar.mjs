import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

await mongoose.connect(process.env.MONGO_URL);

const User = mongoose.model("User", new mongoose.Schema({
  name: String, username: String, email: String,
  avatar: String, bio: String, website: String,
}, { timestamps: true }));

// Find users with broken local avatar URLs
const users = await User.find({ avatar: { $regex: "/uploads/" } });
console.log("Users with local avatar URLs:", users.length);

let fixed = 0;
for (const u of users) {
  const filename = u.avatar.split("/uploads/")[1];
  const filePath = path.join("uploads", filename);
  if (!fs.existsSync(filePath)) {
    // Generate a consistent avatar using pravatar
    const newAvatar = `https://i.pravatar.cc/150?u=${u._id}`;
    await User.findByIdAndUpdate(u._id, { avatar: newAvatar });
    console.log(`Fixed avatar for: ${u.username} → ${newAvatar}`);
    fixed++;
  }
}

console.log(`Fixed ${fixed} broken avatars`);
await mongoose.disconnect();
