// In conversationEvents.ts
import {Server, Socket} from "socket.io";
import {joinConversation, leaveConversation} from "./roomManager";
import logger from "../config/logger";

/**
 * Register conversation-specific events.
 */
export const registerConversationEvents = (socket: Socket, io: Server) => {

    socket.on("joinConversation", async (recipientId) => {
        if (!recipientId) {
            socket.emit("error", {message: "Invalid recipient ID"});
            return;
        }

        try {
            const conversationId = await joinConversation(socket, recipientId);
            if (!conversationId) throw new Error("Failed to join conversation");
            socket.emit("joinedConversation", {conversationId});
        } catch (error: any) {
            logger.error(`Failed to join conversation: ${error.message}`);
            socket.emit("error", {message: error.message});
        }
    });

    socket.on("leaveConversation", async (recipientId) => {
        if (!recipientId) return;

        try {
            await leaveConversation(socket, recipientId);
        } catch (error: any) {
            logger.error(`Failed to leave conversation: ${error.message}`);
            socket.emit("error", {message: error.message});
        }
    });
};
