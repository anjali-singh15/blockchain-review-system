import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

dotenv.config();

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const missingEnvVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"].filter((key) => !process.env[key]);

  if (missingEnvVars.length) {
    const error = new Error(
      `Email service is not configured. Missing environment variables: ${missingEnvVars.join(
        ", ",
      )}. Check your .env file and restart the server.`,
    );
    error.statusCode = 500;
    throw error;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465 ? true : env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
};

export const sendPasswordResetOtpEmail = async ({ email, name, otp }) => {
  try {
    const mailer = getTransporter();

    const info = await mailer.sendMail({
      from: env.mailFrom,
      to: email,
      subject: "Your password reset OTP",
      text: `Hello ${name || "User"},\n\nYour password reset OTP is: ${otp}\n\nThis OTP will expire in ${env.otpExpiryMinutes} minutes.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2>Password Reset OTP</h2>
          <p>Hello ${name || "User"},</p>
          <p>Use the OTP below to reset your password:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
          <p>This OTP will expire in ${env.otpExpiryMinutes} minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    console.log(`OTP email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    error.statusCode = error.statusCode || 500;
    throw error;
  }
};
