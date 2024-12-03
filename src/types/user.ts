// types/user.ts

import { Document } from "mongoose";

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
  followers?: number;
  following?: number;
  website?: string;
  phone?: string;
  social?: Social;
}

// User interface
export interface UserType {
  _id?: string;
  token: string;
  expiresIn: number;
  email: string;
  fullName: string;
  profile?: Profile;
  password?: string;
}
export interface UserDocument extends Document {
  token?: string;
  expiresIn?: number;
  email: string;
  fullName: string;
  profile?: Profile;
  password?: string;
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
