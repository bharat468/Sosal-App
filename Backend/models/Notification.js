import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type:      { type: String, required: true },
  read:      { type: Boolean, default: false },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  post:      { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
  comment:   { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
}, { timestamps: true });

// Notification index for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

export default mongoose.model("Notification", notificationSchema);
