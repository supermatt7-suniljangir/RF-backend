/**
 * WebSocket Module (socket.ts)
 *
 * This module handles all WebSocket-related logic, including:
 * - Connection and disconnection events.
 * - User registration and room management.
 * - Message sending and broadcasting.
 * - Heartbeat mechanism that aligns with the frontend implementation.
 * - Proper error handling and rate limiting.
 */
import {Server} from "socket.io";
import logger from "./config/logger";
import redis from "./utils/redis";
import {handleSendMessage} from "./socketEvents/sendMessage";

/**
 * initializeSocket Function
 *
 * Initializes and configures the WebSocket server.
 *
 * @param io - The Socket.IO server instance.
 */
export const initializeSocket = (io: Server) => {
    io.on("connection", (socket) => {
        logger.info(`User connected: ${socket.id}`);

        // Send periodic pings
        const pingInterval = setInterval(() => {
            socket.emit("ping");
        }, 1000);

        // Register event
        socket.on("register", async (userId) => {
            try {
                logger.info(`User ${userId} registered with socket ID ${socket.id}`);
                await redis.sadd(`userSockets:${userId}`, socket.id);
                await redis.set(`socket:${socket.id}`, userId, "EX", 86400);
                socket.join(userId);
            } catch (error) {
                logger.error(`Error registering user ${userId}: ${error}`);
                socket.emit("error", {message: "Failed to register with server"});
            }
        });

        // Send message event
        socket.on("sendMessage", async ({to, text}) =>
          handleSendMessage(socket, io, to, text)
        );

        // Disconnect event
        socket.on("disconnect", async () => {
            try {
                clearInterval(pingInterval);

                const userId = await redis.get(`socket:${socket.id}`);
                if (userId) {
                    await redis.srem(`userSockets:${userId}`, socket.id);
                    await redis.del(`socket:${socket.id}`);

                    const remainingSockets = await redis.scard(`userSockets:${userId}`);
                    if (remainingSockets === 0) {
                        await redis.del(`userSockets:${userId}`);
                        logger.info(`User ${userId} is fully disconnected.`);
                    }
                    logger.info(`Socket ${socket.id} removed for user ${userId}`);
                }
            } catch (error) {
                logger.error(`Error handling disconnect: ${error}`);
            }
        });
    });

    return {
        cleanup: () => {
            logger.info("Cleaning up socket connections...");
            io.disconnectSockets();
            redis.disconnect();
            logger.info("Socket cleanup completed.");
        },
    };
};
