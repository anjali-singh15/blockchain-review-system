import { app } from "./app.js";
import { connectDatabase, scheduleDatabaseReconnect } from "./config/db.js";
import { env, logEnvDiagnostics, validateEnv } from "./config/env.js";

const PORT = Number(env.port) || 5000;
const host = "0.0.0.0";

const listenOnPort = (portToUse) =>
  new Promise((resolve, reject) => {
    console.log(`Attempting to start server on port ${portToUse}...`);

    const server = app.listen(portToUse, host, () => {
      console.log(`Server listening on http://${host}:${portToUse}`);
      resolve(server);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log("Port already in use. Trying another port...");
        server.close(() => reject(err));
        return;
      }

      reject(err);
    });
  });

const start = async (preferredPort = PORT) => {
  try {
    logEnvDiagnostics();
    validateEnv();
    await listenOnPort(preferredPort);

    try {
      await connectDatabase();
    } catch (error) {
      console.error(error.message);
      console.error("MongoDB is unavailable. Auth and database-backed routes will return 503 until the connection is restored.");
      scheduleDatabaseReconnect();
    }
  } catch (error) {
    if (error.code === "EADDRINUSE") {
      return start(preferredPort + 1);
    }

    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
