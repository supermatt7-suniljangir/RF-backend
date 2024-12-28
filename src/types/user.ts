// types/user.ts

import { Document } from "mongoose";
import { Types } from "mongoose";

// Social interface
export interface Social {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
}

// Profile interface
export interface Profile {
  bio?: string;
  avatar?: string;
  cover?: string;
  website?: string;
  profession?: string;
  availableForHire?: boolean;
  social?: Social;
}

// User interface
export interface UserType {
  _id?: Types.ObjectId;
  email: string;
  fullName: string;
  profile?: Profile;
  password?: string;
  projects: Types.ObjectId[];
}

export interface UserDocument extends Document {
  email: string;
  fullName: string;
  profile?: Profile;
  password?: string;
  projects?: Types.ObjectId[];
  comparePassword?: (enteredPassword: string) => Promise<boolean>;
}
export interface AuthResponse {
  user: UserResponse;
  token?: string;
  expiresIn: string;
}
// Response type for frontend (without password)
export interface UserResponse {
  _id: any;
  email: string;
  fullName: string;
  profile?: Profile;
}

export interface MiniUser {
  _id: Types.ObjectId; 
  fullName: string;
  avatar?: string;
  profession?: string;
  followersCount?: number;
  projects?: Types.ObjectId[];
  availableForHire?: boolean;
}