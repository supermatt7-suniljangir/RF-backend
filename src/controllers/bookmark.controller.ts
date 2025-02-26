import { Request, Response, NextFunction } from "express";
import logger from "../logs/logger";
import { AppError, success } from "../utils/responseTypes";
import User from "../models/user/user.model";
import Project from "../models/project/project.model";
import BookmarkService from "../services/BookmarkService";
import { Types } from "mongoose";

class BookmarkController {
  // Toggle Bookmark
  static toggleBookmark = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { projectId } = req.params;
    const userId = req.user!._id;

    if (!projectId) {
      logger.error("Project ID not provided");
      next(new AppError("Project ID not provided", 400));
      return;
    }

    try {
      // Check if the user exists
      const user = await User.findById(userId, "fullName profile.avatar");
      if (!user) {
        logger.error(`User not found: ${userId}`);
        next(new AppError("User not found", 404));
        return;
      }

      // Check if the project exists
      const project = await Project.findById(projectId);
      if (!project) {
        logger.error(`Project not found: ${projectId}`);
        next(new AppError("Project not found", 404));
        return;
      }

      // Toggle bookmark
      const { bookmarked } = await BookmarkService.toggleBookmark(
        userId,
        projectId
      );

      res.status(bookmarked ? 201 : 200).json(
        success({
          data: bookmarked,
          message: bookmarked ? "Bookmark added" : "Bookmark removed",
        })
      );
    } catch (error) {
      logger.error(`Error toggling bookmark: ${error}`);
      next(new AppError("Error toggling bookmark", 500));
    }
  };

  // Get User Bookmarks
  static getUserBookmarks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user!._id;

    try {
      const bookmarks = await BookmarkService.getUserBookmarks(userId);

      if (!bookmarks.length) {
        logger.info("No bookmarks found");
        res
          .status(200)
          .json(success({ data: [], message: "No bookmarks found" }));
        return;
      }

      const transformedBookmarks = bookmarks
        .map(({ projectId, ...rest }: any) => {
          if (!projectId) return null;
          const project = {
            ...projectId,
            creator: projectId?.creator
              ? {
                  _id: projectId.creator._id,
                  fullName: projectId.creator.fullName,
                  avatar: projectId.creator.profile.avatar,
                  profession: projectId.creator.profile.profession,
                }
              : null,
          };
          return {
            ...rest,
            project,
          };
        })
        .filter((item: any) => item !== null);

      res.status(200).json(
        success({
          data: transformedBookmarks,
          message: "Bookmarks fetched",
        })
      );
    } catch (error) {
      logger.error(`Error fetching bookmarks: ${error}`);
      next(new AppError("Error fetching bookmarks", 500));
    }
  };

  // Check if User has Bookmarked Project
  static hasUserBookmarkedProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { projectId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(200).json(
        success({
          data: false,
          message: "User not logged in",
        })
      );
      return;
    }

    try {
      const hasBookmarked = await BookmarkService.hasUserBookmarkedProject(
        userId,
        projectId
      );

      res.status(200).json(
        success({
          data: hasBookmarked,
          message: hasBookmarked
            ? "User has bookmarked the project"
            : "User has not bookmarked the project",
        })
      );
    } catch (error) {
      logger.error(`Error checking bookmark status: ${error}`);
      next(new AppError("Error checking bookmark status", 500));
    }
  };
}

export default BookmarkController;
