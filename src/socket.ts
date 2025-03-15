import {Server} from "socket.io";
import logger from "./config/logger";
import redis from "./utils/redis";
import {handleSendMessage} from "./socketEvents/sendMessage";
import {registerConversationEvents} from "./socketEvents/conversationEvents";

/**
 * initializeSocket Function
 */
export const initializeSocket = (io: Server) => {
    io.on("connection", (socket) => {

        // Send periodic pings
        const pingInterval = setInterval(() => socket.emit("ping"), 30000);

        // Register user on connection
        socket.on("register", async (userId) => {
            logger.info('the user id while registering is', userId);
            try {
                socket.data.ready = false;
                await redis.sadd(`userSockets:${userId}`, socket.id);
                await redis.set(`socket:${socket.id}`, userId, "EX", 86400);
                socket.data.ready = true;
                registerConversationEvents(socket, io);
                socket.emit("ready");
                logger.info(`User ${userId} registered with socket ${socket.id}`);
            } catch (error) {
                logger.error(`Error registering user ${userId}: ${error}`);
                socket.emit("error", {message: "Failed to register with server"});
            }
        });


        // Handle direct message events (wait until socket is ready)
        socket.on("sendMessage", ({to, text}) => {
            if (!socket.data.ready) {
                socket.emit("error", {message: "Socket not ready"});
                return;
            }
            logger.debug(`recipentId: ${to}, text: ${text}`);
            handleSendMessage(socket, io, to, text);
        })

        // Handle disconnection
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
