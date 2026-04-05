import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URL);

const User = mongoose.model("User", new mongoose.Schema({
  email: String, username: String, role: { type: String, default: "user" }
}, { strict: false }));

const email = process.argv[2] || process.env.ADMIN_EMAIL;
if (!email) { console.error("Usage: node make-admin.mjs <email>"); process.exit(1); }

const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
if (user) console.log(`✅ ${user.username} (${email}) is now admin`);
else console.error("❌ User not found:", email);

await mongoose.disconnect();
