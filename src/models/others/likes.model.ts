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

// Index to efficiently find how many projects a user has liked
LikesSchema.index({ "likedBy.userId": 1 });

// Index to efficiently find how many likes a project has
LikesSchema.index({ projectId: 1 });

// Compound index to avoid duplicate likes by the same user on the same project
LikesSchema.index({ "likedBy.userId": 1, projectId: 1 }, { unique: true });

const Like = model<ILike>("Like", LikesSchema);

export default Like;
