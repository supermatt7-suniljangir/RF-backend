/**
 * Server Initialization Module (server.ts)
 *
 * This module initializes the HTTP server, connects to the database, and integrates WebSocket logic.
 * It also handles graceful shutdown procedures.
 */

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
    
    // Step 3: Initialize Socket.IO with CORS configuration
    const { origin, credentials } = getCorsConfig();
    const io = new Server(server, {
      cors: {
        origin,
        credentials,
      },
    });

    // Step 4: Initialize WebSocket logic
    initializeSocket(io);

    // Step 5: Start the server and listen on the specified port
    server.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
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
        await new Promise((resolve) => {
          server.close(resolve); // Close the HTTP server
        });
        await disconnectDB(); // Disconnect from the database
        process.exit(0); // Exit with success code
      } catch (err) {
        logger.error(`Error during graceful shutdown: ${err}`);
        process.exit(1); // Exit with error code
      }
    };

    // Attach graceful shutdown handlers to SIGTERM and SIGINT signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    // Handle any errors during server initialization
    logger.error(`Error during server initialization: ${error}`);
    process.exit(1); // Exit with error code
  }
};

// Initialize the server
initializeServer();
