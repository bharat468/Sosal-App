import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  author:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mediaUrl:  { type: String, required: true },
  mediaType: { type: String, default: "image" }, // image | video
  caption:   { type: String, default: "" },
  viewers:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

// Auto delete after 24h
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Story", storySchema);
