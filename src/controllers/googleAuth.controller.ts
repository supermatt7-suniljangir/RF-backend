import User from "../models/user/user.model";
import { OAuth2Client } from "google-auth-library";
import { UserDocument } from "../types/user";
import { AppError, success } from "../utils/responseTypes";
import UserService from "../services/UserService";
import { GOOGLE_CLIENT_ID } from "../config/configURLs";
import { NextFunction, Request, Response } from "express";
import generateToken from "../utils/generateToken";
import logger from "../config/logger";

const client = new OAuth2Client(GOOGLE_CLIENT_ID); // Your Google OAuth Client ID

class GoogleAuthController {
  static async googleAuthHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { googleToken } = req.body;
    try {
      if (!googleToken) {
        next(new AppError("No google auth token provided", 400));
        return;
      }
      const googleUserData =
        await GoogleAuthController.googleAuthHelper(googleToken);
      generateToken(res, googleUserData._id);
      res.status(200).json(
        success({
          data: true,
          message: "User authenticated successfully",
        }),
      );
      return;
    } catch (error: AppError | any) {
      logger.error("Error authenticating the user:", error);
      next(new AppError(error.message, error.statusCode || 500));
    }
  }
  // Google login or register function
  static async googleAuthHelper(googleToken: string): Promise<UserDocument> {
    try {
      // Verify the Google ID token
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new AppError("Invalid Google token", 401);
      }

      const user = await UserService.findOrCreateGoogleUser({
        email: payload.email,
        fullName: payload.name,
        avatar: payload.picture,
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      return user as UserDocument;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        error.message || "Google authentication failed",
        error.status || 500,
      );
    }
  }
}

export default GoogleAuthController;
