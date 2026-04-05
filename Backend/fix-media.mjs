import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URL);
console.log("Connected");

const Post = mongoose.model("Post", new mongoose.Schema({
  mediaUrl: String, author: mongoose.Schema.Types.ObjectId,
  caption: String, mediaType: String, shares: { type: Number, default: 0 },
}, { timestamps: true }));

// Fix all posts with empty mediaUrl
const emptyPosts = await Post.find({ mediaUrl: "" });
console.log("Posts with empty media:", emptyPosts.length);

for (let i = 0; i < emptyPosts.length; i++) {
  await Post.findByIdAndUpdate(emptyPosts[i]._id, {
    mediaUrl: `https://picsum.photos/seed/sosal${i + 1}/600/600`,
    mediaType: "image",
  });
}

// Also fix posts with null/undefined mediaUrl
const nullPosts = await Post.find({ mediaUrl: { $in: [null, undefined] } });
for (let i = 0; i < nullPosts.length; i++) {
  await Post.findByIdAndUpdate(nullPosts[i]._id, {
    mediaUrl: `https://picsum.photos/seed/null${i + 1}/600/600`,
    mediaType: "image",
  });
}

console.log(`Fixed ${emptyPosts.length + nullPosts.length} posts total`);
await mongoose.disconnect();
