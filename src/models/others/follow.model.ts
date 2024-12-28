import { Schema, model, Document } from "mongoose";
import { IFollow } from "../../types/others";

const FollowSchema = new Schema<IFollow>(
  {
    follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

const Follow = model<IFollow>("Follow", FollowSchema);

export default Follow;
