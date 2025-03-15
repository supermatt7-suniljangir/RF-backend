import Message from "../models/others/messages.model";
import User from "../models/user/user.model";
import {invalidateCache, redisClient} from "../redis/redisClient";
import logger from "../config/logger";

class MessageService {
    private static MESSAGE_CACHE_EXPIRATION = 60; // 1 min
    private static CONVERSATION_CACHE_EXPIRATION = 30; // 30 sec

    // Cache key generation methods
    private static getMessagesCacheKey(userId: string, receiverId: string): string {
        return `messages:${userId}:${receiverId}`;
    }

    private static getConversationsCacheKey(userId: string): string {
        return `conversations:${userId}`;
    }

    /**
     * Fetch paginated messages between two users.
     */
    static async getMessages(userId: string, receiverId: string, skip: number, limit: number) {
        const cacheKey = this.getMessagesCacheKey(userId, receiverId);

        // Try fetching from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        const [messages, total] = await Promise.all([
            Message.find({
                $or: [
                    {sender: userId, recipient: receiverId},
                    {sender: receiverId, recipient: userId},
                ],
                deleted: false,
            })
                .sort({createdAt: 1})
                .skip(skip)
                .limit(limit)
                .lean(),
            Message.countDocuments({
                $or: [
                    {sender: userId, recipient: receiverId},
                    {sender: receiverId, recipient: userId},
                ],
                deleted: false,
            }),
        ]);

        // Store in cache
        await redisClient.set(cacheKey, JSON.stringify({messages, total}), {EX: this.MESSAGE_CACHE_EXPIRATION});

        return {messages, total};
    }

    /**
     * Get a list of recent conversations for a user with basic user details.
     */
    static async getRecentConversations(userId: string) {
        const cacheKey = this.getConversationsCacheKey(userId);

        // Try fetching from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            logger.debug('cache hit for conversations');
            return JSON.parse(cachedData);
        }

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{sender: userId}, {recipient: userId}],
                    deleted: false,
                },
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: {$lt: ["$sender", "$recipient"]},
                            then: {sender: "$sender", recipient: "$recipient"},
                            else: {sender: "$recipient", recipient: "$sender"},
                        },
                    },
                    lastMessageAt: {$max: "$createdAt"},
                },
            },
            {$sort: {lastMessageAt: -1}},
            {
                $project: {
                    _id: 0,
                    userId: {
                        $cond: {
                            if: {$eq: ["$_id.sender", userId]},
                            then: "$_id.recipient",
                            else: "$_id.sender",
                        },
                    },
                    lastMessageAt: 1,
                },
            },
        ]);

        const userIds = conversations.map((conv) => conv.userId);

        const users = await User.find({_id: {$in: userIds}})
            .select("_id fullName email profile.avatar profile.profession")
            .lean();

        const userMap = new Map(users.map((user) => [user._id.toString(), user]));

        const refinedConversations = conversations.map((conv) => ({
            user: userMap.get(conv.userId.toString()) || null,
            lastMessageAt: conv.lastMessageAt,
        }));

        // Store in cache
        await redisClient.set(cacheKey, JSON.stringify(refinedConversations), {EX: this.CONVERSATION_CACHE_EXPIRATION});

        return refinedConversations;
    }

    static async isNewConversation(conversationId: string) {
        const existingConversation = await Message.findOne({conversationId});
        return !existingConversation;
    }

    static async addNewMessage({senderId, recipientId, text, conversationId}: {
        senderId: string,
        recipientId: string,
        text: string,
        conversationId: string
    }) {

        const newMessage = await Message.create({
            sender: senderId,
            recipient: recipientId,
            conversationId,
            text,
        });

        // Use the generic invalidateCache function
        await invalidateCache(this.getMessagesCacheKey(senderId, recipientId));

        // Also invalidate conversations cache for both users
        await invalidateCache(this.getConversationsCacheKey(senderId));
        await invalidateCache(this.getConversationsCacheKey(recipientId));

        return newMessage;
    }
}

export default MessageService;