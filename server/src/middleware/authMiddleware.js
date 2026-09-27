import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/userModel.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.userId).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid authentication token" });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Authentication token expired" });
    }

    return res.status(401).json({ success: false, message: "Authentication failed" });
  }
};
