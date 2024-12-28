import { Schema, model, Document } from "mongoose";
import { ILike } from "../../types/others";

const LikesSchema = new Schema<ILike>(
  {
    likedBy: {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      fullName: { type: String, required: true },
      avatar: { type: String },
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

const Like = model<ILike>("Like", LikesSchema);

export default Like;
