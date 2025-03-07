import Message from "../models/others/messages.model";
import User from "../models/user/user.model";
import {MiniUser} from "../types/user";

class MessageService {
    /**
     * Fetch paginated messages between two users.
     */
    static async getMessages(
        userId: string,
        receiverId: string,
        skip: number,
        limit: number
    ) {
        const [messages, total] = await Promise.all([
            Message.find({
                $or: [
                    {sender: userId, recipient: receiverId},
                    {sender: receiverId, recipient: userId},
                ],
                deleted: false,
            })
                .sort({createdAt: -1})
                .skip(skip)
                .limit(limit),

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

        // Extract user IDs from conversations
        const userIds = conversations.map((conv: any) => conv.userId);

        // Fetch user details based on `MiniUser` interface
        const users = await User.find({_id: {$in: userIds}})
            .select("_id fullName email profile.avatar profile.profession")
            .lean();

        // Convert user array into a Map for quick lookup
        const userMap = new Map(users.map((user: any) => [user._id.toString(), user]));

        // Attach user details to conversations
        const refinedConversations = conversations.map((conv) => ({
            user: userMap.get(conv.userId.toString()) || null,
            lastMessageAt: conv.lastMessageAt,
        }));

        return refinedConversations;
    }
}

export default MessageService;
