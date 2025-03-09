import {Server, Socket} from "socket.io";
import Message from "../models/others/messages.model";
import {createConversationID} from "../utils/createConversationID";
import logger from "../config/logger";
import redis from "../utils/redis";
import {canSendMessage} from "../utils/rateLimiters";

export const handleSendMessage = async (
    socket: Socket,
    io: Server,
    recipientId: string,
    text: string
) => {
    try {
        if (!recipientId || !text) throw new Error("Recipient ID and message text are required.");

        // ✅ Get sender's userId from Redis (consistent source of truth)
        const senderUserId = await redis.get(`socket:${socket.id}`);
        if (!senderUserId) throw new Error("User not registered.");
        if (senderUserId === recipientId) throw new Error("Cannot send messages to yourself.");

        if (!(await canSendMessage(senderUserId))) {
            throw new Error("Rate limit exceeded. Please wait before sending more messages.");
        }

        // ✅ Generate conversationId internally
        const conversationId = createConversationID(senderUserId, recipientId);
        const isNewConversation = !(await Message.findOne({conversationId}));

        // ✅ Save message to MongoDB
        const newMessage = await Message.create({
            sender: senderUserId,
            recipient: recipientId,
            conversationId,
            text,
        });

        const messageToSend = {
            text,
            sender: senderUserId,
            recipient: recipientId,
            conversationId,
            _id: newMessage._id,
        };

        // ✅ Emit to the conversation-based room
        io.to(`chat:${conversationId}`).emit("receiveMessage", messageToSend);

        // ✅ Revalidate conversations using user-specific sockets
        const recipientSockets = await redis.smembers(`userSockets:${recipientId}`);
        if (isNewConversation) {
            recipientSockets.forEach((socketId) => {
                io.to(socketId).emit("revalidateConversations", {
                    with: senderUserId,
                });
            });
            const senderSockets = await redis.smembers(`userSockets:${senderUserId}`);
            senderSockets.forEach((socketId) => {
                io.to(socketId).emit("revalidateConversations", {
                    with: recipientId,
                });
            });
        }


        logger.info(`Message sent from ${senderUserId} to ${recipientId}`);
    } catch (error: any) {
        logger.error(`Error sending message: ${error.message}`);
        socket.emit("error", {
            code: error.message.includes("Rate limit") ? "RATE_LIMITED" : "MESSAGE_FAILED",
            message: error.message || "Failed to send message",
        });
    }
};
