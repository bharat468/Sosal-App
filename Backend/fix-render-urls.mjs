import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URL);

const Post = mongoose.model("Post", new mongoose.Schema({
  mediaUrl: String, mediaType: String,
}, { strict: false }), "posts");

// Fix all posts with render.com/uploads URLs (these 404 in production)
const broken = await Post.find({ mediaUrl: { $regex: "onrender.com/uploads" } });
console.log("Broken posts:", broken.length);

for (let i = 0; i < broken.length; i++) {
  const p = broken[i];
  if (p.mediaType === "video") {
    await Post.findByIdAndUpdate(p._id, { mediaUrl: "", mediaType: "text" });
    console.log(`Cleared video: ${p._id}`);
  } else {
    const newUrl = `https://picsum.photos/seed/render${i}/600/600`;
    await Post.findByIdAndUpdate(p._id, { mediaUrl: newUrl });
    console.log(`Fixed image: ${p._id}`);
  }
}

console.log("Done!");
await mongoose.disconnect();
