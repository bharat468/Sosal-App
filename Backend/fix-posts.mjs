import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

await mongoose.connect(process.env.MONGO_URL);
console.log("Connected");

const Post = mongoose.model("Post", new mongoose.Schema({
  mediaUrl: String, author: mongoose.Schema.Types.ObjectId,
  caption: String, mediaType: String, shares: Number,
}, { timestamps: true }));

const posts = await Post.find({ mediaUrl: { $regex: "/uploads/" } });
console.log("Posts with local URLs:", posts.length);

let broken = 0, ok = 0;
for (const p of posts) {
  const filename = p.mediaUrl.split("/uploads/")[1];
  const filePath = path.join("uploads", filename);
  if (!fs.existsSync(filePath)) {
    await Post.findByIdAndUpdate(p._id, { mediaUrl: "", mediaType: "text" });
    broken++;
  } else { ok++; }
}

console.log(`Fixed broken: ${broken} | OK: ${ok}`);
await mongoose.disconnect();
