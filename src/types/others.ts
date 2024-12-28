import { Types } from "mongoose";

export interface IComment {
  _id?: Types.ObjectId;
  content: string;
  projectId: Types.ObjectId; // Reference to the project
  author: {
    userId: Types.ObjectId; // Reference to the user
    fullName: string;
    avatar?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
export interface ILike {
  _id?: Types.ObjectId;
  likedBy: {
    userId: Types.ObjectId;
    fullName: string;
    avatar?: string;
  }; // The user who liked the project
  projectId: Types.ObjectId; // The project that was liked
  createdAt: Date;
}
export interface IBookmark {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  project: Types.ObjectId;
  createdAt: Date;
}

export interface IFollow {
  _id?: Types.ObjectId;
  follower: Types.ObjectId;
  following: Types.ObjectId;
  createdAt: Date;
}
