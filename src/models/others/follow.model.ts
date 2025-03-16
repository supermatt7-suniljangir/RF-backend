import { Schema, model } from "mongoose";
import { IFollow } from "../../types/others"; // Assuming you have a type for this

const FollowSchema = new Schema<IFollow>(
  {
    follower: {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      fullName: { type: String, required: true },
      avatar: { type: String },
    },
    following: {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      fullName: { type: String, required: true },
      avatar: { type: String },
    },
    followedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

// Index to efficiently find who is following a specific user
FollowSchema.index({ "follower.userId": 1 });

// Index to efficiently find the followers of a specific user
FollowSchema.index({ "following.userId": 1 });

// Compound index to avoid duplicate follow relationships
FollowSchema.index(
  { "follower.userId": 1, "following.userId": 1 },
  { unique: true },
);

const Followe = model<IFollow>("Follower", FollowSchema);
export default Followe;
