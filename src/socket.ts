/**
 * WebSocket Module (socket.ts)
 *
 * This module handles all WebSocket-related logic, including:
 * - Connection and disconnection events.
 * - User registration and room management.
 * - Message sending and broadcasting.
 */

import { Server } from "socket.io";
import logger from "./config/logger";
import Redis from "ioredis";
import Message from "./models/others/messages.model";

// Initialize Redis client
const redis = new Redis();

// Handle Redis connection errors
redis.on("error", (err) => {
  logger.error(`Redis error: ${err}`);
});

/**
 * initializeSocket Function
 *
 * Initializes and configures the WebSocket server.
 *
 * @param io - The Socket.IO server instance.
 */
export const initializeSocket = (io: Server) => {
  /**
   * WebSocket Event: "connection"
   * This event is triggered when a client connects to the WebSocket server.
   * It logs the connection and sets up event listeners for the socket.
   */
  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.id}`);

    /**
     * WebSocket Event: "register"
     *
     * This event is triggered when a client registers with their user ID.
     * The socket joins a room named after the user ID, allowing messages to be sent directly to them.
     * Stores the userId → socketId mapping in Redis.
     * Also stores socketId → userId for quick lookup on disconnect.
     */
    socket.on("register", async (userId) => {
      try {
        logger.info(`User ${userId} registered with socket ID ${socket.id}`);

        // Store in Redis for 1 day
        await redis.sadd(`userSockets:${userId}`, socket.id);
        await redis.set(`socket:${socket.id}`, userId, "EX", 86400);

        socket.join(userId);
      } catch (error) {
        logger.error(`Error during user registration: ${error}`);
      }
    });

    /**
     * Rate Limiting Helper Function
     * Limits users to 5 messages per 10 seconds.
     */
    const canSendMessage = async (userId: string) => {
      const key = `rateLimit:${userId}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, 10); // Reset every 10 seconds
      }

      return count <= 5; // Allow max 5 messages per 10 seconds
    };

    /**
     * WebSocket Event: "sendMessage"
     *
     * Retrieves recipient's socket ID from Redis.
     * Sends the message to the recipient.
     * Extra check to prevent self-messaging (though handled by UI).
     *
     * @param to - The recipient's user ID.
     * @param text - The message content.
     */
    socket.on("sendMessage", async ({ to, text }) => {
      try {
        if (!to || !text) {
          throw new Error("Recipient ID and message text are required.");
        }

        const senderUserId = await redis.get(`socket:${socket.id}`);
        if (!senderUserId) throw new Error("User not registered.");

        if (senderUserId === to)
          throw new Error("Cannot send messages to yourself.");

        // Rate limiting check
        if (!(await canSendMessage(senderUserId))) {
          throw new Error("Rate limit exceeded. Please wait.");
        }
        // Generate consistent conversationId
        const conversationId = createConversationId(senderUserId, to);

        // Check if this is a new conversation
        const existingConversation = await Message.findOne({ conversationId });
        const isNewConversation = !existingConversation;

        // Save message to MongoDB
        const newMessage = await Message.create({
          sender: senderUserId,
          recipient: to,
          conversationId,
          text,
        });
        // Create message object in consistent format for both sender and recipient
        const messageToSend = {
          text,
          sender: senderUserId,
          recipient: to,
          _id: newMessage._id,
          // Add any other fields from newMessage that you need in the frontend
        };
        // Send message to all recipient devices
        const recipientSockets = await redis.smembers(`userSockets:${to}`);

        recipientSockets.forEach((socketId) => {
          io.to(socketId).emit("receiveMessage", messageToSend);
          if (isNewConversation) {
            io.to(socketId).emit("revalidateConversations", {
              with: senderUserId,
            });
            io.to(senderUserId).emit("revalidateConversations", {
              with: to,
            });
          }
        });

        socket.emit("receiveMessage", messageToSend);
      } catch (error) {
        logger.error(`Error sending message: ${error}`);
        socket.emit("messageError", {
          error: "Failed to send message",
        });
      }
    });

    /**
     * WebSocket Event: "disconnect"
     *
     * Removes the user from Redis when they disconnect.
     * This event is triggered when a client disconnects from the WebSocket server.
     * It logs the disconnection and removes the user from the mapping.
     */
    socket.on("disconnect", async () => {
      try {
        const userId = await redis.get(`socket:${socket.id}`);

        if (userId) {
          // Remove this specific socket from the user's set
          await redis.srem(`userSockets:${userId}`, socket.id);
          await redis.del(`socket:${socket.id}`);

          // Check if user has any active sockets left
          const remainingSockets = await redis.scard(`userSockets:${userId}`);
          if (remainingSockets === 0) {
            await redis.del(`userSockets:${userId}`); // Remove empty set
            logger.info(`User ${userId} is fully disconnected.`);
          }

          logger.info(`Socket ${socket.id} removed for user ${userId}`);
        } else {
          logger.warn(`Socket ${socket.id} not found in Redis`);
        }
      } catch (error) {
        logger.error(`Error handling disconnect: ${error}`);
      }
    });
  });
};

function createConversationId(userId1: string, userId2: string): string {
  // Convert to string if they're ObjectIds
  const id1 = userId1.toString();
  const id2 = userId2.toString();

  // Create a consistent ID regardless of order
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
}
