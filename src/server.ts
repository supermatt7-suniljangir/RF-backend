// server.ts
import { PORT } from "./config/configURLs";
import { connectDB, disconnectDB } from "./config/db";
import app from "./app";
import logger from "./logs/logger";

const initializeServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown`);
      try {
        await new Promise((resolve) => {
          server.close(resolve);
        });
        await disconnectDB();
        process.exit(0);
      } catch (err) {
        logger.error(`Error during graceful shutdown: ${err}`);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error(`Error during server initialization: ${error}`);
    process.exit(1);
  }
};

initializeServer();
