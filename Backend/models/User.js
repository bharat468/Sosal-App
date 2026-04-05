import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, maxlength: 50 },
  username:  { type: String, required: true, unique: true, maxlength: 30 },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, default: null },
  googleId:  { type: String, default: null, unique: true, sparse: true },
  avatar:    { type: String, default: "" },
  bio:       { type: String, default: "", maxlength: 150 },
  website:   { type: String, default: "" },
  isPrivate: { type: Boolean, default: false },
  isBanned:  { type: Boolean, default: false },
  role:      { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true });

// username & email already indexed via unique:true above — no need for extra index()

export default mongoose.model("User", userSchema);
