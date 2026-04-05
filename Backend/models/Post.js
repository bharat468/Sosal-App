import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  caption:   { type: String, default: "", maxlength: 2200 },
  mediaUrl:  { type: String, default: "" },
  mediaType: { type: String, default: "text", enum: ["text", "image", "video"] },
  shares:    { type: Number, default: 0 },
  hashtags:  [{ type: String }],
  author:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ mediaType: 1, createdAt: -1 });

export default mongoose.model("Post", postSchema);
