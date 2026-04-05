import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ message: "No token provided" });

  try {
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    const user    = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user     = user;
    req.user._id = user._id;
    req.user.id  = user._id.toString();
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default protect;
