// controllers/userController.ts
import { Request, Response } from "express";
import asyncHandler from "../middlewares/asyncHanlder";
import User from "../models/user/user.model";
import jwt from "jsonwebtoken";
import { googleAuth } from "./googleAuth.controller";
import Project from "../models/project/project.model";
import { Types } from "mongoose";
import { Profile, Social, UserDocument, UserType } from "../types/user";
import logger from "../logs/logger";

// @desc   Auth user & get token
// @route  POST /api/users/login
// @access Public
const authUser = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { email, password, googleToken } = req.body;
    if (googleToken) {
      try {
        const googleUserData = await googleAuth(googleToken);
        generateToken(res, googleUserData._id);
        return res
          .status(201)
          .json({ message: "user authenticated successfuly" });
      } catch (error: any) {
        res.status(401);
        throw new Error("Google authentication failed: " + error.message);
      }
    } else {
      const user = await User.findOne({ email }).select("+password");
      console.log(user);
      if (!user || !user.comparePassword!(password)) {
        res.status(401);
        throw new Error("Invalid email or password");
      }
      const token = generateToken(res, user._id);
      res.status(201).json({
        message: "user authenticated successfuly",
      });
    }
  }
);

// @desc   Register user
// @route  POST /api/users
// @access Public
const registerUser = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { email, password, fullName, googleToken } = req.body;

    if (googleToken) {
      try {
        const googleUserData = await googleAuth(googleToken);
        generateToken(res, googleUserData._id);
        return res.status(201).json({ message: "user created successfuly" });
      } catch (error: any) {
        res.status(401);
        throw new Error("Google authentication failed: " + error.message);
      }
    } else {
      // const validationError = validateUserData(req.body);
      // console.log(validationError, req.body);
      // if (validationError) {
      //   res.status(400);
      //   throw new Error(validationError);
      // }

      const { email, password, fullName } = req.body;

      const userExists = await checkUserExists(email);
      if (userExists) {
        res.status(400);
        throw new Error("User already exists");
      }

      const newUser = await User.create({ email, password, fullName });

      generateToken(res, newUser._id);
      res.status(201).json({ message: "user created successfuly" });
    }
  }
);

const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id).populate({
    path: "projects",
    select: "_id title thumbnail stats featured publishedAt status",
  });

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc   Update user profile
// @route  PUT /api/users/profile
// @access Private
// const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
//   const user = await User.findById(req.user?._id);
//   if (user) {
//     user.fullName = req.body.fullName || user.fullName;
//     user.email = req.body.email || user.email;
//     if (req.body.password) {
//       user.password = req.body.password;
//     }

//     await user.save();

//     res.json({
//       _id: user._id,
//       fullName: user.fullName,
//       email: user.email,
//       profile: user.profile,
//       token: generateToken(res, user._id),
//     });
//   } else {
//     res.status(404);
//     throw new Error("User not found");
//   }
// });

const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  let user: UserDocument | null = await User.findById(req.user?._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // initialize profile if it doesn't exist
  if (!user.profile) {
    user.profile = {} as Profile;
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
      field in user.schema.paths &&
      field !== "password" &&
      field !== "profile"
    ) {
      (user as UserType)[field as keyof UserType] = req.body[field];
    }
  });

  await user.save();

  const updatedUser = await User.findById(user._id);

  if (!updatedUser) {
    res.status(500);
    throw new Error("Error fetching updated user");
  }

  res.json(updatedUser.toObject());
});

// @desc   Get all users
// @route  GET /api/users
// @access Private/Admin
const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({});
  res.json(users);
});

// @desc   Delete user
// @route  DELETE /api/users/:id
// @access Private/Admin
const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (user) {
    res.json({ message: "User deleted" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc   Get user by ID
// @route  GET /api/users/:id
// @access Private/Admin
const getUserById = asyncHandler(async (req: Request, res: Response) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    res.status(404).json({
      success: false,
      message: "Invalid user ID",
    });
    throw new Error("Invalid user ID");
  }
  const user = await User.findById(req.params.id);
  if (user) {
    res.json({
      success: true,
      data: user,
    });
  } else {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    throw new Error("User not found");
  }
});

// @desc   Update user by ID
// @route  PUT /api/users/:id
// @access Private/Admin
const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.fullName = req.body.fullName || user.fullName;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }
    await user.save();

    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

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
// Generate JWT token function
const generateToken = (res: Response, _id: any): string => {
  // Generate the JWT token
  const token = jwt.sign({ _id }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });
  res.cookie(
    // Set the token as HTTP-only cookie
    "auth_token",
    token,
    {
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // Protection against CSRF
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      path: "/", // Cookie is available for all routes
    }
  );

  return token; // Optionally return token if needed elsewhere
};

const logoutUser = (req: Request, res: Response): void => {
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
      res.status(400).json({ error: "No auth token found in cookies." });
    }
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export {
  authUser,
  registerUser,
  updateUserProfile,
  getUserProfile,
  getUsers,
  deleteUser,
  logoutUser,
  getUserById,
  updateUser,
  generateToken,
};
