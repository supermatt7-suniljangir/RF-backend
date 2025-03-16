import { PORT } from "./config/configURLs"; // Configuration for server port
import { connectDB, disconnectDB } from "./config/db"; // Database connection utilities
import app from "./app"; // Express application
import logger from "./config/logger"; // Custom logger for logging server events
import { Server } from "socket.io"; // Socket.IO for WebSocket communication
import http from "http"; // HTTP module for creating the server
import { initializeSocket } from "./socket"; // WebSocket logic
import { getCorsConfig } from "./config/corsConfig"; // CORS configuration

/**
 * initializeServer Function
 *
 * This function initializes the server, sets up WebSocket communication, and handles graceful shutdown.
 */
const initializeServer = async () => {
  try {
    // Step 1: Connect to the database
    await connectDB();

    // Step 2: Create an HTTP server and attach the Express app
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: getCorsConfig(),
    });

    // Step 4: Initialize WebSocket logic and get the cleanup function
    const socketManager: { cleanup: () => void } = initializeSocket(io);

    // Step 5: Start the server and listen on the specified port
    server.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
      );
    });

    /**
     * Graceful Shutdown Handler
     *
     * This function ensures the server shuts down gracefully on SIGTERM or SIGINT signals.
     */
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown`);
      try {
        // First, clean up socket connections
        socketManager.cleanup();

        // Then close the HTTP server
        await new Promise((resolve) => {
          server.close(resolve);
        });

        // Finally disconnect from the database
        await disconnectDB();

        logger.info("Graceful shutdown completed successfully");
        process.exit(0); // Exit with success code
      } catch (err) {
        logger.error(`Error during graceful shutdown: ${err}`);
        process.exit(1); // Exit with error code
      }
    };

    // Use a single handler to prevent multiple handlers being registered
    let shuttingDown = false;
    const handleShutdown = (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      gracefulShutdown(signal);
    };

    // Attach graceful shutdown handlers to SIGTERM and SIGINT signals
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
  } catch (error) {
    // Handle any errors during server initialization
    logger.error(`Error during server initialization: ${error}`);
    process.exit(1); // Exit with error code
  }
};

// Initialize the server
initializeServer();
