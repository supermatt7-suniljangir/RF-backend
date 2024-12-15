import { UserType } from "./user";

 export interface ITools {
    name: string;
    icon?: string;
  }
 export interface Imedia {
    type: "image" | "video";
    url: string;
  }
  // Simplified comment interface
 export interface IComment {
    user: any; // User ID
    content: string;
    createdAt: Date;
  }
  export interface ProjectMini{
    _id?: string;
    title: string;
    thumbnail: string;
    stats: {
      views: number;
      likes: number;
      comments: number;
    };
    creator:UserType;
    featured: boolean;
    publishedAt: Date;
    status: 'draft' | 'published';
    category: string;
  }
  // Main Project Type
  export interface ProjectType {
    _id?: string;
    title: string;
    description: string;
    shortDescription: string;
    thumbnail: string;
    media: Imedia[];
    creator: string; // User ID
    collaborators?: string[]; // Array of user IDs
    tags: string[];
    tools: ITools[];
    category: string;
    stats: {
      views: number;
      likes: number;
      comments: number;
    };
    comments: IComment[]; // Simplified comments array
    featured: boolean;
    publishedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
    status: 'draft' | 'published';
    projectUrl?: string;
    copyright: {
      license: string;
      allowsDownload: boolean;
      commercialUse: boolean;
    };
  }