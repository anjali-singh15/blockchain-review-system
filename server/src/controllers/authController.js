import crypto from "crypto";
import jwt from "jsonwebtoken";
import { isDatabaseConnected } from "../config/db.js";
import { env } from "../config/env.js";
import { sendPasswordResetOtpEmail } from "../services/emailService.js";
import { User } from "../models/userModel.js";

const OTP_DIGITS = 6;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

const createToken = (userId) =>
  jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: "7d",
  });

const isValidEmail = (value) => /.+@.+\..+/.test(value);
const hashValue = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  trustScore: typeof user.trustScore === "number" ? user.trustScore : 75,
  isAdmin: user.role === "admin",
  role: user.role ?? "user",
});

const ensureDatabaseReady = () => {
  if (!isDatabaseConnected()) {
    const error = new Error("Database unavailable. Please try again shortly.");
    error.statusCode = 503;
    throw error;
  }
};

const normalizeAndValidateEmail = (email) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    const error = new Error("Enter a valid email address");
    error.statusCode = 400;
    throw error;
  }

  return normalizedEmail;
};

const generateOtp = () =>
  crypto
    .randomInt(0, 10 ** OTP_DIGITS)
    .toString()
    .padStart(OTP_DIGITS, "0");

const clearPasswordResetState = {
  passwordResetOtpHash: "",
  passwordResetOtpExpiresAt: null,
  passwordResetAttempts: 0,
  passwordResetVerifiedAt: null,
  passwordResetTokenHash: "",
  passwordResetTokenExpiresAt: null,
};

export const register = async (req, res, next) => {
  try {
    ensureDatabaseReady();
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    const normalizedEmail = normalizeAndValidateEmail(email);

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const token = createToken(user._id.toString());

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    ensureDatabaseReady();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = normalizeAndValidateEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found" });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const token = createToken(user._id.toString());

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    ensureDatabaseReady();
    const normalizedEmail = normalizeAndValidateEmail(req.body.email);
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetAttempts +passwordResetTokenHash +passwordResetTokenExpiresAt +passwordResetVerifiedAt",
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found for that email address" });
    }

    const otp = generateOtp();
    const otpHash = hashValue(otp);
    const expiryDate = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpiresAt = expiryDate;
    user.passwordResetAttempts = 0;
    user.passwordResetVerifiedAt = null;
    user.passwordResetTokenHash = "";
    user.passwordResetTokenExpiresAt = null;
    await user.save();

    await sendPasswordResetOtpEmail({
      email: user.email,
      name: user.name,
      otp,
    });

    return res.json({
      success: true,
      message: "OTP sent to your registered email address",
      data: {
        email: user.email,
        expiresInMinutes: env.otpExpiryMinutes,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    ensureDatabaseReady();
    const normalizedEmail = normalizeAndValidateEmail(req.body.email);
    const otp = `${req.body.otp || ""}`.trim();

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Enter the 6-digit OTP" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetAttempts +passwordResetTokenHash +passwordResetTokenExpiresAt +passwordResetVerifiedAt",
    );

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ success: false, message: "No active OTP request found for this email" });
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      Object.assign(user, clearPasswordResetState);
      await user.save();
      return res.status(400).json({ success: false, message: "OTP has expired. Request a new one." });
    }

    if (user.passwordResetAttempts >= MAX_OTP_ATTEMPTS) {
      Object.assign(user, clearPasswordResetState);
      await user.save();
      return res.status(429).json({ success: false, message: "Too many incorrect OTP attempts. Request a new OTP." });
    }

    if (hashValue(otp) !== user.passwordResetOtpHash) {
      user.passwordResetAttempts += 1;
      await user.save();
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetVerifiedAt = new Date();
    user.passwordResetTokenHash = hashValue(resetToken);
    user.passwordResetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    user.passwordResetOtpHash = "";
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetAttempts = 0;
    await user.save();

    return res.json({
      success: true,
      message: "OTP verified successfully",
      data: {
        email: user.email,
        resetToken,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    ensureDatabaseReady();
    const normalizedEmail = normalizeAndValidateEmail(req.body.email);
    const resetToken = `${req.body.resetToken || ""}`.trim();
    const newPassword = `${req.body.newPassword || ""}`;
    const confirmPassword = `${req.body.confirmPassword || ""}`;

    if (!resetToken) {
      return res.status(400).json({ success: false, message: "Reset token is required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password +passwordResetTokenHash +passwordResetTokenExpiresAt +passwordResetVerifiedAt +passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetAttempts",
    );

    if (!user || !user.passwordResetTokenHash || !user.passwordResetTokenExpiresAt) {
      return res.status(400).json({ success: false, message: "Reset session is invalid. Verify OTP again." });
    }

    if (user.passwordResetTokenExpiresAt.getTime() < Date.now()) {
      Object.assign(user, clearPasswordResetState);
      await user.save();
      return res.status(400).json({ success: false, message: "Reset session has expired. Verify OTP again." });
    }

    if (hashValue(resetToken) !== user.passwordResetTokenHash) {
      return res.status(400).json({ success: false, message: "Reset session is invalid. Verify OTP again." });
    }

    user.password = newPassword;
    Object.assign(user, clearPasswordResetState);
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    return next(error);
  }
};
