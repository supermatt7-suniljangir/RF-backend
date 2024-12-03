import User from "../models/user/user.model";
import { OAuth2Client } from "google-auth-library";
import { generateToken } from "./user.controller";
import { AuthResponse, UserDocument } from "../types/user";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Your Google OAuth Client ID

// Google login or register function
const googleAuth = async (googleToken: string): Promise<UserDocument> => {
  // Verify the Google ID token
  const ticket = await client.verifyIdToken({
    idToken: googleToken,
    audience: process.env.GOOGLE_CLIENT_ID, // Your Google OAuth Client ID
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Invalid Google token");
  }

  // Check if the user already exists in the database
  let user = await User.findOne({ email: payload.email });

  if (!user) {
    // If the user doesn't exist, create a new one
    user = await User.create({
      email: payload.email,
      fullName: payload.name,
      profile: {
        avatar: payload.picture,
      },
    });
  }
  return user;
};

export { googleAuth };
