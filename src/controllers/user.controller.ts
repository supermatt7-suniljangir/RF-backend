import { NextFunction, Request, Response } from "express";
import asyncHandler from "../middlewares/asyncHanlder";
import User from "../models/user/user.model";
import { googleAuth } from "./googleAuth.controller";
import { Types } from "mongoose";
import { Profile, Social, UserDocument, UserType } from "../types/user";
import logger from "../logs/logger";
import { AppError } from "../middlewares/error";
import generateToken from "../utils/generateToken";

// @desc   Auth user & get token
// @route  POST /api/users/login
// @access Public
export const authUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { email, password, googleToken } = req.body;
    logger.info("authUser", { email, password, googleToken });

    if (googleToken) {
      try {
        const googleUserData = await googleAuth(googleToken);
        generateToken(res, googleUserData._id);
        return res
          .status(201)
          .json({ message: "User authenticated successfully" });
      } catch (error: any) {
        return next(
          new AppError("Google authentication failed: " + error.message, 401)
        );
      }
    } else {
      const user = await User.findOne({ email }).select("+password");
      console.log(user);

      if (!user || !user.comparePassword!(password)) {
        return next(new AppError("Invalid email or password", 401));
      }
      generateToken(res, user._id);
      return res.status(201).json({
        message: "User authenticated successfully",
      });
    }
  }
);

// @desc   Register user
// @route  POST /api/users
// @access Public
export const registerUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { email, password, fullName, googleToken } = req.body;

    if (googleToken) {
      try {
        const googleUserData = await googleAuth(googleToken);
        generateToken(res, googleUserData._id);
        return res.status(201).json({ message: "User created successfully" });
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
        res.status(201).json({ message: "User created successfully" });
      } catch (error: any) {
        return next(new AppError(error.message, 500));
      }
    }
  }
);

// @desc   Get user profile
// @route  GET /api/users/profile
// @access Private
export const getUserProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("User not found", 404));
    }
    try {
      const user = await User.findById(req.user._id)
        .populate({
          path: "projects",
          select: "_id title thumbnail stats featured publishedAt status",
        })
        .populate({
          path: "profile.followers",
          select:
            "_id fullName profile.avatar profile.profession profile.availableForHire",
        })
        .populate({
          path: "profile.following",
          select:
            "_id fullName profile.avatar profile.profession profile.availableForHire",
        })

      if (!user) {
        return next(new AppError("User not found", 404));
      }

      res.status(200).json(user);
    } catch (error: any) {
      return next(new AppError(error.message, 500));
    }
  }
);

// @desc   Update user profile
// @route  PUT /api/users/profile
// @access Private
export const updateUserProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
            (user.profile as Profile)[field as keyof Omit<Profile, "social">] =
              req.body.profile[field];
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

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error: any) {
      return next(new AppError(error.message, 500));
    }
  }
);

// @desc   Get all users
// @route  GET /api/users
// @access Private/Admin
export const getUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await User.find({});
      res.json(users);
    } catch (error: any) {
      return next(new AppError(error.message, 500));
    }
  }
);

// @desc   Delete user
// @route  DELETE /api/users/:id
// @access Private/Admin
export const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return next(new AppError("User not found", 404));
      }
      res.json({ message: "User deleted" });
    } catch (error: any) {
      return next(new AppError(error.message, 500));
    }
  }
);

// @desc   Get user by ID
// @route  GET /api/users/:id
// @access Private/Admin
export const getUserById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id)) {
        return next(new AppError("Invalid user ID", 404));
      }

      const user = await User.findById(req.params.id)
        .populate({
          path: "projects",
          select: "_id title thumbnail stats featured publishedAt status",
        })
        .populate({
          path: "profile.followers",
          select:
            "_id fullName profile.avatar profile.profession profile.availableForHire",
        })
        .populate({
          path: "profile.following",
          select:
            "_id fullName profile.avatar profile.profession profile.availableForHire",
        });

      if (!user) {
        return next(new AppError("User not found", 404));
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      return next(new AppError(error.message, 500));
    }
  }
);

// @desc   Update user by ID
// @route  PUT /api/users/:id
// @access Private/Admin
export const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(new AppError("User not found", 404));
      }

      user.fullName = req.body.fullName || user.fullName;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = req.body.password;
      }
      await user.save();

      res.status(200).json({
        status: "success",
        data: user,
      });
    } catch (error: any) {
      return next(new AppError(error.message, 500));
    }
  }
);

// Validation helper
const validateUserData = (data: {
  email: string;
  password: string;
  fullName: string;
}): string | null => {
  const requiredFields: (keyof typeof data)[] = [
    "email",
    "password",
    "fullName",
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      return `Field '${field}' is required`;
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) return "Provide a valid email";
  if (data.password.length < 8)
    return "Password must be at least 8 characters long";
  if (data.fullName.length < 3)
    return "Name must be at least 3 characters long";

  return null;
};

async function checkUserExists(email: string): Promise<boolean> {
  try {
    const user = await User.exists({ email });
    return user !== null;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
}

// @desc   Logout user
// @route  POST /api/users/logout
// @access Private
export const logoutUser = asyncHandler(
  (req: Request, res: Response, next: NextFunction): any => {
    console.log(req.cookies);
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
        res.status(200).json({ message: "Logged out successfully." });
      } else {
        return next(new AppError("No auth token found in cookies.", 400));
      }
    } catch (error: any) {
      return next(new AppError("Internal server error.", 500));
    }
  }
);
