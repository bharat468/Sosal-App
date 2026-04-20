import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "spam",
      "harassment",
      "hate_speech",
      "impersonation",
      "nudity",
      "violence",
      "scam",
      "false_information",
      "other",
    ],
  },
  details: {
    type: String,
    default: "",
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ["pending", "in_review", "resolved", "dismissed"],
    default: "pending",
    index: true,
  },
  adminNote: {
    type: String,
    default: "",
    maxlength: 500,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

reportSchema.index({ createdAt: -1 });

export default mongoose.model("Report", reportSchema);
