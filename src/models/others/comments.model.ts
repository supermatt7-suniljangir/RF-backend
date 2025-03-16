import { Schema, model } from "mongoose";
import { IComment } from "../../types/others";

const CommentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    author: {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      fullName: { type: String, required: true },
      avatar: { type: String },
    },
  },
  { timestamps: true, versionKey: false },
);

const Comment = model("Comment", CommentSchema);
export default Comment;
