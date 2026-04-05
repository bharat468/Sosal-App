import "dotenv/config";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

await mongoose.connect(process.env.MONGO_URL);
console.log("Connected");

const Post = mongoose.model("Post", new mongoose.Schema({
  mediaUrl: String, mediaType: String, caption: String,
}, { strict: false }), "posts");

// Find all posts with render.com or localhost URLs
const broken = await Post.find({
  $or: [
    { mediaUrl: { $regex: "onrender.com/uploads" } },
    { mediaUrl: { $regex: "localhost" } },
  ]
});
console.log(`Found ${broken.length} posts with broken URLs`);

for (let i = 0; i < broken.length; i++) {
  const p = broken[i];
  const filename = p.mediaUrl.split("/uploads/")[1];
  const localPath = path.join("uploads", filename || "");

  if (p.mediaType === "video") {
    // Try to upload from local if exists
    if (filename && fs.existsSync(localPath)) {
      try {
        console.log(`Uploading video: ${filename}`);
        const result = await cloudinary.uploader.upload(localPath, {
          folder: "sosal/videos",
          resource_type: "video",
        });
        await Post.findByIdAndUpdate(p._id, { mediaUrl: result.secure_url });
        console.log(`✅ Video uploaded: ${result.secure_url}`);
      } catch (e) {
        console.log(`❌ Upload failed, clearing: ${e.message}`);
        await Post.findByIdAndUpdate(p._id, { mediaUrl: "", mediaType: "text" });
      }
    } else {
      console.log(`❌ Video not found locally, clearing: ${p._id}`);
      await Post.findByIdAndUpdate(p._id, { mediaUrl: "", mediaType: "text" });
    }
  } else {
    // Image — try local upload or use picsum
    if (filename && fs.existsSync(localPath)) {
      try {
        const result = await cloudinary.uploader.upload(localPath, {
          folder: "sosal/posts",
          resource_type: "image",
        });
        await Post.findByIdAndUpdate(p._id, { mediaUrl: result.secure_url });
        console.log(`✅ Image uploaded: ${result.secure_url}`);
      } catch (e) {
        const fallback = `https://picsum.photos/seed/fix${i}/600/600`;
        await Post.findByIdAndUpdate(p._id, { mediaUrl: fallback });
        console.log(`⚠️ Image fallback: ${fallback}`);
      }
    } else {
      const fallback = `https://picsum.photos/seed/fix${i}/600/600`;
      await Post.findByIdAndUpdate(p._id, { mediaUrl: fallback });
      console.log(`⚠️ Image fallback: ${fallback}`);
    }
  }
}

// Show remaining video posts
const videos = await Post.find({ mediaType: "video", mediaUrl: { $ne: "" } });
console.log(`\n✅ Active video posts: ${videos.length}`);
videos.forEach(v => console.log(" -", v.mediaUrl.substring(0, 60)));

console.log("\nDone!");
await mongoose.disconnect();
