import { Types } from "mongoose";
import DbService from ".";
import Message from "../models/others/messages.model";
import { IMessage } from "../types/others";
import User from "../models/user/user.model";

class MessagesService {
  private dbService = new DbService<IMessage>(Message);

  // Send a new message
  async sendMessage(senderId: string, recipientId: string, text: string) {
    if (
      !Types.ObjectId.isValid(senderId) ||
      !Types.ObjectId.isValid(recipientId)
    ) {
      throw new Error("Invalid user ID");
    }

    const sender = await User.findById(senderId, "fullName profile.avatar");
    if (!sender) throw new Error("Sender not found");

    const recipient = await User.findById(recipientId);
    if (!recipient) throw new Error("Recipient not found");

    const message = await this.dbService.create({
      sender: senderId,
      recipient: recipientId,
      text,
    });

    return message;
  }

  async getMessages(
    userId1: string,
    userId2: string,
    limit = 20,
    skip = 0
  ): Promise<{
    messages: IMessage[];
    total: number;
  }> {
    const messages = await this.dbService.findAll(
      {
        $or: [
          { sender: userId1, recipient: userId2 },
          { sender: userId2, recipient: userId1 },
        ],
      },
      "sender recipient text status createdAt",
      limit,
      skip,
      "-createdAt"
    );

    return { messages, total: messages.length };
  }

  // Mark message as read
  async markAsRead(messageId: string, userId: string) {
    const message = await this.dbService.findById(messageId);
    if (!message) throw new Error("Message not found");
    if (message.recipient.toString() !== userId)
      throw new Error("Unauthorized");

    return this.dbService.update(messageId, {
      status: "read",
      readAt: new Date(),
    });
  }
}

export default new MessagesService();
