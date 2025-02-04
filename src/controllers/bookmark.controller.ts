import { Request, Response, NextFunction } from "express";
import asyncHandler from "../middlewares/asyncHanlder";
import { AppError } from "../middlewares/error";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import Comment from "../models/others/comments.model";
import { IComment } from "../types/others";
import logger from "../logs/logger";
import { UserType } from "../types/user";
import Bookmark from "../models/others/bookmark.model";

export const toggleBookmark = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { projectId } = req.params;
    const userId = req.user!._id;

    try {
      // Check if the project exists
      const project = await Project.findById(projectId);
      if (!project) {
        logger.error(`Project not found: ${projectId}`);
        return next(new AppError("Project not found", 404));
      }

      // Check if the user exists
      const user: UserType | null = await User.findById(
        userId,
        "fullName profile.avatar"
      );
      if (!user) {
        logger.error(`User not found: ${userId}`);
        return next(new AppError("User not found", 404));
      }

      // Check if bookmark exists
      const bookmarkExists = await Bookmark.findOne({ userId, projectId });

      if (bookmarkExists) {
        // Remove bookmark if it exists
        await Bookmark.deleteOne({ userId, projectId });
        logger.info(`Bookmark removed: User ${userId}, Project ${projectId}`);
        return res
          .status(200)
          .json({ message: "Bookmark removed", success: true });
      }

      // Add new bookmark
      await Bookmark.create({ userId, projectId });
      logger.info(`Bookmark added: User ${userId}, Project ${projectId}`);
      return res.status(201).json({ message: "Bookmark added", success: true });
    } catch (error) {
      logger.error(`Error toggling bookmark: ${error}`);
      return next(new AppError("Error toggling bookmark", 500));
    }
  }
);

export const getUserBookmarks = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const userId = req.user!._id;
    try {
      const bookmarks: any = await Bookmark.find({ userId })
        .populate({
          path: "projectId",
          select: "title thumbnail stats category publishedAt status",
          populate: {
            path: "creator",
            select: "_id fullName profile.avatar profile.profession",
          },
        })
        .lean();

      if (!bookmarks.length) {
        return res.status(200).json({
          success: true,
          message: "No bookmarks found",
          data: [],
        });
      }

      const transformedBookmarks = bookmarks.map(
        ({ projectId, ...rest }: { projectId: any; [key: string]: any }) => {
          // Simplifying the project data and modifying the creator field
          const project = {
            ...projectId,
            creator: projectId.creator
              ? {
                  _id: projectId.creator._id,
                  fullName: projectId.creator.fullName,
                  avatar: projectId.creator.profile.avatar,
                  profession: projectId.creator.profile.profession,
                }
              : null, // Handle the case where creator might be null
          };

          return {
            ...rest,
            project, // Add the transformed project data
          };
        }
      );

      res.status(200).json({
        success: true,
        data: transformedBookmarks,
      });
    } catch (error) {
      logger.error(`Error fetching bookmarks: ${error}`);
      next(new AppError("Error fetching bookmarks", 500));
    }
  }
);

export const hasUserBookmarkedProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { projectId } = req.params; // Get projectId from params
  const userId = req.user?._id; // Extract userId from the logged-in user's data
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
    // Check if the user has bookmarked the project by looking for the userId in the bookmarks
    const bookmark = await Bookmark.findOne({
      userId, // Check if the bookmark belongs to the logged-in user
      projectId, // Check if the bookmark is for the specific project
    });

    // If bookmark exists, return true, meaning the user has bookmarked the project
    if (bookmark) {
      return res.status(200).json({
        success: true,
        message: "User has bookmarked the project",
        data: true,
      });
    }

    // If no bookmark found, return false, meaning the user has not bookmarked the project
    return res.status(200).json({
      success: false,
      message: "User has not bookmarked the project",
      data: false,
    });
  } catch (error) {
    // Handle any unexpected errors
    return next(new AppError("Error checking bookmark status", 500));
  }
};
