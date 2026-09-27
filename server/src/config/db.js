import mongoose from "mongoose";
import { env } from "./env.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let retryTimer = null;

mongoose.set("bufferCommands", false);

const validateMongoUri = (uri) => {
  if (!uri) {
    throw new Error("MONGO_URI is missing");
  }

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error("MONGO_URI must start with mongodb:// or mongodb+srv://");
  }

  if (!uri.includes("@")) {
    throw new Error("MONGO_URI appears to be missing credentials or cluster host");
  }

  const uriWithoutQuery = uri.split("?")[0];
  const pathPart = uriWithoutQuery.substring(uriWithoutQuery.lastIndexOf("/") + 1);

  if (!pathPart) {
    console.warn(
      "MONGO_URI does not include an explicit database name. Add one like mongodb+srv://user:pass@cluster.mongodb.net/reviewtrust",
    );
  }
};

export const connectDatabase = async ({ retries = 3, retryDelayMs = 5000 } = {}) => {
  let lastError;
  validateMongoUri(env.mongoUri);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      console.log(`Connecting to MongoDB (attempt ${attempt}/${retries})...`);
      await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log("MongoDB connected");
      return;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection attempt ${attempt} failed: ${error.message}`);

      if (attempt < retries) {
        console.log(`Retrying MongoDB connection in ${retryDelayMs / 1000}s...`);
        await wait(retryDelayMs);
      }
    }
  }

  throw new Error(`Database connection failed: ${lastError.message}`);
};

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export const scheduleDatabaseReconnect = (delayMs = 10000) => {
  if (retryTimer || isDatabaseConnected()) {
    return;
  }

  retryTimer = setTimeout(async () => {
    retryTimer = null;

    try {
      console.log("Retrying MongoDB connection...");
      await connectDatabase({ retries: 1 });
    } catch (error) {
      console.error(error.message);
      scheduleDatabaseReconnect(delayMs);
    }
  }, delayMs);
};
