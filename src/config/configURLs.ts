import dotenv from "dotenv";
dotenv.config();

import { STAGES } from "../utils/stages";

export const MONGO_URI: string = process.env.MONGO_URI as string;
export const NODE_ENV = process.env.NODE_ENV || STAGES.DEV;
export const PORT = process.env.PORT || "5500";
export const JWT_SECRET = process.env.JWT_SECRET!;
export const PROD_ORIGINS = [
  "https://www.rf.suniljangir.in",
  "https://rf.suniljangir.in",
];
export const DEV_ORIGINS = ["http://localhost:5173"];
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
