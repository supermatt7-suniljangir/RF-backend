/**
 * Message Handler Module (messageHandler.ts)
 *
 * Handles sending and receiving messages over WebSocket.
 */
import {Server, Socket} from "socket.io";
import Message from "../models/others/messages.model";
import {createConversationID} from "../utils/createConversationID";
import logger from "../config/logger";
import redis from "../utils/redis";
import {canSendMessage} from "../utils/rateLimiters";

/**
 * Handles the "sendMessage" event.
 * @param socket - The connected socket instance.
 * @param io - The Socket.IO server instance.
 * @param to - Recipient user ID.
 * @param text - Message content.
 */
export const handleSendMessage = async (
  socket: Socket,
  io: Server,
  to: string,
  text: string
) => {
    try {
        if (!to || !text) {
            throw new Error("Recipient ID and message text are required.");
        }

        const senderUserId = await redis.get(`socket:${socket.id}`);
        if (!senderUserId) {
            logger.warn(`Unregistered socket ${socket.id} attempted to send a message`);
            throw new Error("User not registered.");
        }

        if (senderUserId === to) {
            throw new Error("Cannot send messages to yourself.");
        }

        if (!(await canSendMessage(senderUserId))) {
            logger.warn(`Rate limit exceeded for user ${senderUserId}`);
            throw new Error("Rate limit exceeded. Please wait before sending more messages.");
        }

        // Generate consistent conversationId
        const conversationId = createConversationID(senderUserId, to);
        const existingConversation = await Message.findOne({conversationId});
        const isNewConversation = !existingConversation;

        // Save message to MongoDB
        const newMessage = await Message.create({
            sender: senderUserId,
            recipient: to,
            conversationId,
            text,
        });

        const messageToSend = {
            text,
            sender: senderUserId,
            recipient: to,
            _id: newMessage._id,
        };

        // Send to recipient sockets
        const recipientSockets = await redis.smembers(`userSockets:${to}`);
        recipientSockets.forEach((socketId) => {
            io.to(socketId).emit("receiveMessage", messageToSend);
            if (isNewConversation) {
                io.to(socketId).emit("revalidateConversations", {
                    with: senderUserId,
                });
            }
        });

        if (isNewConversation) {
            io.to(senderUserId).emit("revalidateConversations", {
                with: to,
            });
        }

        socket.emit("receiveMessage", messageToSend);

        logger.info(`Message sent from ${senderUserId} to ${to}`);
    } catch (error: any) {
        logger.error(`Error sending message: ${error}`);
        socket.emit("error", {
            code: error.message.includes("Rate limit") ? "RATE_LIMITED" : "MESSAGE_FAILED",
            message: error.message || "Failed to send message",
        });
    }
};
