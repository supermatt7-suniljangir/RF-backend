import User from "../models/user/user.model";
import { OAuth2Client } from "google-auth-library";
import { UserDocument } from "../types/user";
import { AppError } from "../utils/responseTypes";
import UserService from "../services/UserService";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Your Google OAuth Client ID

// Google login or register function
const googleAuth = async (googleToken: string): Promise<UserDocument> => {
  try {
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Your Google OAuth Client ID
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new AppError("Invalid Google token", 401);
    }
    let user: UserDocument;

    // Check if the user already exists in the database
    let ifExists = await UserService.checkUserExists(payload.email);
    if (!ifExists) {
      // If the user doesn't exist, create a new one
      user = await User.create({
        email: payload.email,
        fullName: payload.name,
        followingCount: 0,
        followersCount: 0,
        profile: {
          avatar: payload.picture,
        },
      });
    } else {
      user = (await UserService.getUserByEmail(payload.email)) as UserDocument;
      if (!user) {
        throw new AppError("User not found", 404);
      }
    }
    return user;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    // For other errors, wrap them in an AppError
    throw new AppError(
      error.message || "Google authentication failed",
      error.status || 500
    );
  }
};

export { googleAuth };
