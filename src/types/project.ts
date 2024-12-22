import { Types } from "mongoose";
import { MiniUser, UserType } from "./user";

export interface ITools {
  name: string;
  icon?: string;
}
export interface Imedia {
  type: "image" | "video";
  url: string;
}
export interface IComment {
  _id?: Types.ObjectId;
  content: string;
  createdAt: Date;
  userData?: {            // Populated data
    userId: Types.ObjectId;
    fullName: string;
    avatar: string;
  };
}

export interface IStats {
  views: number;
  likes: number;
  comments: number;
}

export interface ICopyright {
  license: string;
  allowsDownload: boolean;
  commercialUse: boolean;
}

export interface MiniProject {
  _id?: Types.ObjectId;
  title: string;
  thumbnail: string;
  stats: IStats;
  creator: MiniUser;
  featured: boolean;
  publishedAt: Date;
  status: "draft" | "published";
  category: string;
}
// Main Project Type
export interface ProjectType {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  media: Imedia[];
  creator: MiniUser; // User ID
  collaborators?: string[]; // Array of user IDs
  tags: string[];
  tools: ITools[];
  category: string;
  stats: IStats;
  comments: IComment[]; // Simplified comments array
  featured: boolean;
  publishedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  status: "draft" | "published";
  projectUrl?: string;
  copyright: ICopyright;
}

export interface ProjectDocument extends Document {
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  media: Imedia[];
  creator: Types.ObjectId;
  collaborators?: Types.ObjectId[];
  tags: string[];
  tools: ITools[];
  category: string;
  stats: IStats;
  comments: IComment[];
  featured: boolean;
  publishedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  status: "draft" | "published";
  projectUrl?: string;
  copyright: ICopyright;
}
