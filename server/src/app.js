import express from "express";
import cors from "cors";
import morgan from "morgan";
import reviewRoutes from "./routes/reviewRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import datasetRoutes from "./routes/datasetRoutes.js";
import { env } from "./config/env.js";
import { isDatabaseConnected } from "./config/db.js";
import { errorHandler } from "./utils/errorHandler.js";

export const app = express();

app.use(
  cors({
    origin: [env.clientUrl, "http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    database: isDatabaseConnected() ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", datasetRoutes);
app.use("/api", reviewRoutes);
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});
app.use(errorHandler);
