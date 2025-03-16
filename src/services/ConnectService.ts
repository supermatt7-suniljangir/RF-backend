import Message from "../models/others/messages.model";
import User from "../models/user/user.model";
import logger from "../config/logger";

class ConnectService {
    /**
     * Fetch paginated messages between two users.
     */
    static async getMessages(
        userId: string,
        receiverId: string,
        skip: number,
        limit: number,
    ) {
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

        return {messages, total};
    }

    /**
     * Get a list of recent conversations for a user with basic user details.
     */
    static async getRecentConversations(userId: string) {
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

        return refinedConversations;
    }

    static async isNewConversation(conversationId: string) {
        const existingConversation = await Message.findOne({conversationId});
        return !existingConversation;
    }

    static async addNewMessage({
                                   senderId,
                                   recipientId,
                                   text,
                                   conversationId,
                               }: {
        senderId: string;
        recipientId: string;
        text: string;
        conversationId: string;
    }) {
        const newMessage = await Message.create({
            sender: senderId,
            recipient: recipientId,
            conversationId,
            text,
        });

        return newMessage;
    }

    static async deleteConversation(userId: string, recipientId: string) {
        const session = await Message.startSession();
        session.startTransaction();

        try {
            await Message.deleteMany({
                $or: [
                    {sender: userId, recipient: recipientId},
                    {sender: recipientId, recipient: userId},
                ],
            }).session(session);

            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error("Error deleting conversation:", error);
            throw new Error("Failed to delete conversation");
        }
    }
}

export default ConnectService;