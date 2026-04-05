import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  text:     { type: String, required: true },
  mediaUrl: { type: String, default: "" },
  read:     { type: Boolean, default: false },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
