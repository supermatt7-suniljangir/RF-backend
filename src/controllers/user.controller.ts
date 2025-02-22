import { NextFunction, Request, RequestHandler, Response } from "express";
import asyncHandler from "../middlewares/asyncHanlder";
import User from "../models/user/user.model";
import { googleAuth } from "./googleAuth.controller";
import { Types } from "mongoose";
import { Profile, Social, UserDocument, UserType } from "../types/user";
import logger from "../logs/logger";
import generateToken from "../utils/generateToken";
import { AppError, success } from "../utils/responseTypes";

class UserController {
  public getUserProfile = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      if (!req.user) {
        return next(new AppError("User not found", 404));
      }
      try {
        const user = await User.findById(req.user._id);
        if (!user) {
          return next(new AppError("User not found", 404));
        }

        return res.status(200).json(
          success({
            data: user,
            message: "User Profile fetched successfully",
          })
        );
      } catch (error: any) {
        logger.error("Error fetching user profile:", error);
        return next(new AppError(error.message, 500));
      }
    }
  ) as RequestHandler;

  public authUser = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<Response | void> => {
      const { email, password, googleToken } = req.body;

      try {
        // Google Authentication Flow
        if (googleToken) {
          const googleUserData = await googleAuth(googleToken);
          // Check if user exists in the database
          const user = await User.findOne({ email: googleUserData.email });
          if (!user) {
            return next(new AppError("User not found", 404));
          }
          generateToken(res, user._id);
          return res.status(200).json(
            success({
              data: true,
              message: "User authenticated successfully",
            })
          );
        }

        // Email/Password Authentication Flow
        const user = await User.findOne({ email }).select("+password");

        // Check if user exists and password is correct
        if (!user) {
          return next(new AppError("Invalid email or password", 401));
        }

        const isPasswordCorrect = await user.comparePassword!(password);
        if (!isPasswordCorrect) {
          return next(new AppError("Invalid email or password", 401));
        }

        generateToken(res, user._id);
        return res.status(200).json(
          success({
            data: true,
            message: "User authenticated successfully",
          })
        );
      } catch (error: any) {
        logger.error("Error authenticating user:", error.message);
        return next(
          new AppError(`Error Authenticating user: ${error.message}`, 500)
        );
      }
    }
  ) as RequestHandler;

  public registerUser = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      const { email, password, fullName, googleToken } = req.body;

      if (googleToken) {
        try {
          const googleUserData = await googleAuth(googleToken);
          generateToken(res, googleUserData._id);
          return res.status(201).json(
            success({
              message: "User created successfully",
              data: true,
            })
          );
        } catch (error: any) {
          return next(
            new AppError("Google authentication failed: " + error.message, 401)
          );
        }
      } else {
        try {
          const userExists = await checkUserExists(email);
          if (userExists) {
            return next(new AppError("User already exists", 400));
          }

          const newUser = await User.create({ email, password, fullName });
          generateToken(res, newUser._id);
          return res.status(201).json(
            success({
              message: "User created successfully",
              data: true,
            })
          );
        } catch (error: any) {
          logger.error("Error creating user:", error);
          return next(new AppError(error.message, 500));
        }
      }
    }
  ) as RequestHandler;

  public updateUserProfile = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      try {
        let user: UserDocument | null = await User.findById(req.user?._id);

        if (!user) {
          return next(new AppError("User not found", 404));
        }

        // Ensure profile is always initialized
        if (!user.profile) {
          user.profile = {} as Profile;
        }

        if (req.body.fileKey) {
          user.profile.avatar = req.body.fileKey;
        }

        // Handle profile updates with deep merging
        if (req.body.profile) {
          // Handle regular profile fields
          Object.keys(req.body.profile).forEach((field) => {
            if (field !== "social") {
              // Type assertion since we know these fields exist in Profile type
              (user.profile as Profile)[
                field as keyof Omit<Profile, "social">
              ] = req.body.profile[field];
            }
          });
          // Handle social media updates separately
          if (req.body.profile.social) {
            if (!user.profile.social) {
              user.profile.social = {} as Social;
            }

            Object.keys(req.body.profile.social).forEach((field) => {
              // Type assertion since we know these fields exist in Social type
              (user.profile!.social as Social)[field as keyof Social] =
                req.body.profile.social[field];
            });
          }
        }

        // Handle other top-level fields
        Object.keys(req.body).forEach((field) => {
          if (
            field in user!.schema.paths &&
            field !== "password" &&
            field !== "profile"
          ) {
            (user as UserType)[field as keyof UserType] = req.body[field];
          }
        });

        await user.save();

        const updatedUser = await User.findById(user._id);

        if (!updatedUser) {
          return next(new AppError("Error fetching updated user", 500));
        }

        return res.status(200).json(
          success({
            data: updatedUser,
            message: "User Profile updated successfully",
          })
        );
      } catch (error: any) {
        logger.error("Error updating user profile:", error);
        return next(new AppError(error.message, 500));
      }
    }
  ) as RequestHandler;

  // public deleteUser = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     try {
  //       const user = await User.findByIdAndDelete(req.params.id);
  //       if (!user) {
  //         return next(new AppError("User not found", 404));
  //       }
  //       res.json({ message: "User deleted" });
  //     } catch (error: any) {
  //       return next(new AppError(error.message, 500));
  //     }
  //   }
  // ) as RequestHandler;

  public getUserById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!Types.ObjectId.isValid(req.params.id)) {
          return next(new AppError("Invalid user ID", 404));
        }

        const user = await User.findById(req.params.id);
        if (!user) {
          return next(new AppError("User not found", 404));
        }

        res.status(200).json(
          success({
            data: user,
            message: "User fetched successfully",
          })
        );
      } catch (error: any) {
        return next(new AppError(error.message, 500));
      }
    }
  ) as RequestHandler;

  public logoutUser = asyncHandler(
    (req: Request, res: Response, next: NextFunction): any => {
      try {
        // Check if the cookie exists
        if (req.cookies?.auth_token) {
          // Clear the auth_token cookie
          res.clearCookie("auth_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
          });
          res
            .status(200)
            .json(success({ data: true, message: "User logged out" }));
        } else {
          return next(new AppError("No auth token found in cookies.", 400));
        }
      } catch (error: any) {
        return next(new AppError("Internal server error.", 500));
      }
    }
  ) as RequestHandler;
}

async function checkUserExists(email: string): Promise<boolean> {
  try {
    const user = await User.exists({ email });
    return user !== null;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
}

export default UserController;
