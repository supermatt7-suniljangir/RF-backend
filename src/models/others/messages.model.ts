import mongoose, { Document, Schema, Model } from "mongoose";
import { IMessage } from "../../types/others";

/**
 * Interface defining the structure of a chat message.
 */

/**
 * Mongoose schema for chat messages.
 */
const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: String, required: true, index: true }, // Indexed for faster lookups
    recipient: { type: String, required: true, index: true }, // Indexed for efficient recipient searches
    text: { type: String, required: true }, // Stores the message text
    deleted: { type: Boolean, default: false, index: true }, // Soft delete for hiding messages
  },
  { timestamps: true }
);

/**
 * Message model based on the schema.
 */
const Message: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  MessageSchema
);

export default Message;
