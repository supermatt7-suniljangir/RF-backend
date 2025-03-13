import {Socket} from "socket.io";
import logger from "../config/logger";
import {createConversationID} from "../utils/createConversationID";
import redis from "../utils/redis";

/**
 * Joins a room based on conversation ID (computed internally).
 *
 * @param socket - The socket instance.
 * @param userId - ID of the other participant.
 * @returns The computed conversationId.
 */
export const joinConversation = async (socket: Socket, userId: string): Promise<string> => {
    try {
        const senderUserId = await redis.get(`socket:${socket.id}`);
        if (!senderUserId || !userId) throw new Error("Invalid user state");

        const conversationId = createConversationID(senderUserId, userId);
        socket.join(`chat:${conversationId}`);

        return conversationId;
    } catch (error: any) {
        logger.error(`joinConversation failed: ${error.message}`);
        throw new Error("Failed to join conversation");
    }
};

export const leaveConversation = async (socket: Socket, userId: string): Promise<void> => {
    try {
        const senderUserId = await redis.get(`socket:${socket.id}`);
        if (!senderUserId || !userId) throw new Error("Invalid user state");

        const conversationId = createConversationID(senderUserId, userId);
        socket.leave(`chat:${conversationId}`);
    } catch (error: any) {
        logger.error(`leaveConversation failed: ${error.message}`);
        throw new Error("Failed to leave conversation");
    }
};
