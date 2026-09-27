import { Router } from "express";
import {
  forgotPassword,
  login,
  register,
  resetPassword,
  verifyOtp,
} from "../controllers/authController.js";
import { createOtpRateLimiter } from "../middleware/otpRateLimitMiddleware.js";

const router = Router();
const forgotPasswordLimiter = createOtpRateLimiter({
  keyPrefix: "forgot-password",
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
  getKey: (req) => `${req.ip}:${req.body.email?.trim().toLowerCase() || "unknown"}`,
  message: "Too many OTP requests. Please wait 15 minutes and try again.",
});
const verifyOtpLimiter = createOtpRateLimiter({
  keyPrefix: "verify-otp",
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  getKey: (req) => `${req.ip}:${req.body.email?.trim().toLowerCase() || "unknown"}`,
  message: "Too many OTP verification attempts. Please request a new OTP.",
});

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-otp", verifyOtpLimiter, verifyOtp);
router.post("/reset-password", resetPassword);

export default router;
