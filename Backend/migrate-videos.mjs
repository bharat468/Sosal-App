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
  mediaUrl: String, mediaType: String,
}, { strict: false }), "posts");

const videos = await Post.find({ mediaType: "video", mediaUrl: { $regex: "/uploads/" } });
console.log(`Found ${videos.length} videos to migrate`);

for (const v of videos) {
  const filename = v.mediaUrl.split("/uploads/")[1];
  const localPath = path.join("uploads", filename);

  if (!fs.existsSync(localPath)) {
    console.log(`❌ File not found locally: ${filename} — clearing`);
    await Post.findByIdAndUpdate(v._id, { mediaUrl: "", mediaType: "text" });
    continue;
  }

  try {
    console.log(`Uploading: ${filename}`);
    const result = await cloudinary.uploader.upload(localPath, {
      folder: "sosal/videos",
      resource_type: "video",
    });
    await Post.findByIdAndUpdate(v._id, { mediaUrl: result.secure_url });
    console.log(`✅ Migrated: ${result.secure_url}`);
  } catch (e) {
    console.error(`❌ Failed: ${filename}`, e.message);
    await Post.findByIdAndUpdate(v._id, { mediaUrl: "", mediaType: "text" });
  }
}

console.log("Done!");
await mongoose.disconnect();
