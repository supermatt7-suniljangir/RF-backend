import { PORT } from "./config/configURLs";
import { connectDB, disconnectDB } from "./config/db";
import app from "./app";
import logger from "./config/logger";
import { Server } from "socket.io";
import http from "http";

const initializeServer = async () => {
  try {
    await connectDB();
    
    // Attach WebSocket to the existing HTTP server
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === "production"
          ? ["https://yourdomain.com", "https://www.yourdomain.com"]
          : "http://localhost:5173",
        credentials: true,
      },
    });

    // WebSocket Logic
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      socket.on("register", (userId) => {
        console.log(`User ${userId} registered with socket ID ${socket.id}`);
        socket.join(userId); // Join a room with user ID
      });

      socket.on("sendMessage", ({ to, text }) => {
        console.log(`Message from ${socket.id} to ${to}: ${text}`);
        io.to(to).emit("receiveMessage", { from: socket.id, text });
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });

    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Graceful shutdown
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
