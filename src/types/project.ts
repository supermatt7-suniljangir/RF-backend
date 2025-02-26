import { Document, Types } from "mongoose";
import { MiniUser, UserType } from "./user";

export interface ITools {
  _id?: Types.ObjectId;
  name: string;
  icon?: string;
}

export interface Imedia {
  _id?: Types.ObjectId;
  type: "image" | "video";
  url: string;
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
  creator: Types.ObjectId | string; // User ID
  collaborators?: (Types.ObjectId | string)[]; // Array of user IDs
  tags: string[];
  tools: ITools[];
  category: string;
  stats: IStats;
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
  creator: Types.ObjectId | string;
  collaborators?: (Types.ObjectId | string)[];
  tags: string[];
  tools: ITools[];
  category: string;
  stats: IStats;
  featured: boolean;
  publishedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  status: "draft" | "published";
  projectUrl?: string;
  copyright: ICopyright;
}
