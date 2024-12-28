import { NextFunction, Request, Response } from "express";
import Like from "../models/others/likes.model";
import Project from "../models/project/project.model";
import { AppError } from "../middlewares/error";
import logger from "../logs/logger";
import User from "../models/user/user.model";

export const toggleLikeProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { projectId } = req.params;
  const userId = req.user!._id; // Assume user ID is extracted from auth middleware

  try {
    // Ensure the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    const user: { fullName: string; avatar?: string } | null =
      await User.findById(userId, "fullName profile.avatar");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if the user already liked the project
    const existingLike = await Like.findOne({
      projectId,
      "likedBy.userId": userId,
    });

    if (existingLike) {
      // Unlike the project
      await existingLike.deleteOne();
      project.stats.likes = Math.max(0, project.stats.likes - 1);
      await project.save();

      return res.status(200).json({
        success: true,
        message: "Project unliked",
      });
    } else {
      // Add a new like
      await Like.create({
        projectId,
        likedBy: {
          userId,
          fullName: user.fullName,
          avatar: user?.avatar,
        },
      });
      project.stats.likes += 1;
      await project.save();

      return res.status(200).json({
        success: true,
        message: "Project liked",
      });
    }
  } catch (error) {
    logger.error(`Error toggling like: ${error}`);
    return next(new AppError("Error toggling like/unlike", 500));
  }
};

// Fetch all likes on a project
export const fetchProjectLikes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { projectId } = req.params;

  try {
    const likes = await Like.find({ projectId });
    return res.status(200).json({ success: true, data: likes });
  } catch (error) {
    logger.error(`Error fetching project likes: ${error}`);
    next(new AppError(`Error fetching project likes: ${error}`, 500));
  }
};

export const hasUserLikedProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { projectId } = req.params; // Get projectId from params
  const userId = req.user!._id; // Extract userId from the logged-in user's data

  // If userId is not found or undefined, return false (not logged in)
  if (!userId) {
    return res.status(200).json({
      success: false,
      message: "User not logged in",
      data: false,
    });
  }

  // Validate if the user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404)); // If user is not found, throw an error
  }

  try {
    // Check if the user has liked the project by looking for the userId in likedBy.userId
    const like = await Like.findOne({
      projectId,
      "likedBy.userId": userId, // Check against userId in the likedBy field
    });

    // If like exists, return true, meaning the user has liked the project
    if (like) {
      return res.status(200).json({
        success: true,
        message: "User has liked the project",
        data: true,
      });
    }

    // If no like found, return false, meaning the user has not liked the project
    return res.status(200).json({
      success: false,
      message: "User has not liked the project",
      data: false,
    });
  } catch (error) {
    // Handle any unexpected errors
    return next(new AppError("Error checking like status", 500));
  }
};
