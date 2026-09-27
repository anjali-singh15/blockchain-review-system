import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.resolve(__dirname, "../../.env");
const rootEnvPath = path.resolve(__dirname, "../../../.env");
const loadedEnvFiles = [];

[serverEnvPath, rootEnvPath].forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
    loadedEnvFiles.push(envPath);
  }
});

const requiredVars = ["MONGO_URI", "JWT_SECRET"];
const placeholderValues = new Set([
  "your_mongodb_connection",
  "your_wallet_private_key",
  "your_sepolia_rpc_url",
  "optional_blockchain_rpc_url",
  "optional_blockchain_private_key",
  "optional_blockchain_contract_address",
  "deployed_contract_address",
  "your_jwt_secret",
]);

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  rpcUrl: process.env.SEPOLIA_RPC_URL || process.env.RPC_URL,
  privateKey: process.env.PRIVATE_KEY,
  contractAddress: process.env.CONTRACT_ADDRESS,
  jwtSecret: process.env.JWT_SECRET,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER,
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 5),
  passwordResetTokenSecret: process.env.PASSWORD_RESET_TOKEN_SECRET || process.env.JWT_SECRET,
};

export const logEnvDiagnostics = () => {
  const mongoUriSummary = env.mongoUri
    ? env.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@")
    : "not-set";

  console.log("Loaded env files:", loadedEnvFiles.length ? loadedEnvFiles : "none");
  console.log("Environment check:", {
    PORT: env.port,
    MONGO_URI: mongoUriSummary,
    JWT_SECRET: env.jwtSecret ? "loaded" : "missing",
    SEPOLIA_RPC_URL: env.rpcUrl ? "loaded" : "missing",
    SMTP_HOST: env.smtpHost ? "loaded" : "missing",
    SMTP_USER: env.smtpUser ? "loaded" : "missing",
  });
};

export const validateEnv = () => {
  const missing = requiredVars.filter((key) => {
    const value = process.env[key];
    return !value || placeholderValues.has(value);
  });

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(
        ", ",
      )}. Update the root .env file with real values before starting the server.`,
    );
  }
};
