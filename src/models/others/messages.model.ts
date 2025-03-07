import mongoose, {Document, Schema, Model} from "mongoose";
import {IMessage} from "../../types/others";

/**
 * Interface defining the structure of a chat message.
 */

/**
 * Mongoose schema for chat messages.
 */
const MessageSchema = new Schema<IMessage>(
    {
        sender: {type: String, required: true, index: true}, // Indexed for faster lookups
        recipient: {type: String, required: true, index: true}, // Indexed for efficient recipient searches
        text: {type: String, required: true}, // Stores the message text
        conversationId: {type: String, required: true},
        deleted: {type: Boolean, default: false, index: true}, // Soft delete for hiding messages
    },
    {timestamps: true}
);

MessageSchema.index({sender: 1, recipient: 1});
MessageSchema.index({conversationId: 1});

/**
 * Message model based on the schema.
 */
const Message: Model<IMessage> = mongoose.model<IMessage>(
    "Message",
    MessageSchema
);

export default Message;
