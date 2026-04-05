import mongoose from "mongoose";

const trackSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  artist:   { type: String, default: "Unknown" },
  url:      { type: String, required: true }, // audio file URL
  duration: { type: Number, default: 0 },     // seconds
  cover:    { type: String, default: "" },
  genre:    { type: String, default: "General" },
}, { timestamps: true });

export default mongoose.model("Track", trackSchema);
