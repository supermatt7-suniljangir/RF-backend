import { Request, Response, NextFunction, RequestHandler } from "express";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import Bookmark from "../models/others/bookmark.model";
import logger from "../logs/logger";
import { UserType } from "../types/user";
import { AppError, success } from "../utils/responseTypes";

class BookmarkController {
  // Toggle Bookmark
  static toggleBookmark = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { projectId } = req.params;
    if (!projectId) {
      logger.error("Project ID not provided");
      next(new AppError("Project ID not provided", 400));
      return;
    }
    const userId = req.user!._id;

    // Check if the user exists
    const user: UserType | null = await User.findById(
      userId,
      "fullName profile.avatar"
    );
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

    try {
      // Check if bookmark exists
      const bookmarkExists = await Bookmark.findOne({ userId, projectId });

      if (bookmarkExists) {
        // Remove bookmark if it exists
        await Bookmark.deleteOne({ userId, projectId });
        logger.info(`Bookmark removed: User ${userId}, Project ${projectId}`);
        res
          .status(200)
          .json(success({ data: false, message: "Bookmark removed" }));
        return;
      }

      // Add new bookmark
      await Bookmark.create({ userId, projectId });
      logger.info(`Bookmark added: User ${userId}, Project ${projectId}`);
      res
        .status(201)
        .json(success({ data: true, message: "Bookmark added" }));
    } catch (error) {
      logger.error(`Error toggling bookmark: ${error}`);
      next(new AppError("Error toggling bookmark", 500));
    }
  }

  // Get User Bookmarks
  static getUserBookmarks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user!._id;
    try {
      if (!userId) {
        next(new AppError("User not found", 404));
        return;
      }

      const bookmarks = await Bookmark.find({ userId })
        .populate({
          path: "projectId",
          select: "title thumbnail stats category publishedAt status",
          populate: {
            path: "creator",
            select: "_id fullName profile.avatar profile.profession email profile.availableForHire",
          },
        })
        .lean();

      if (!bookmarks.length) {
        logger.info("No bookmarks found");
        res
          .status(200)
          .json(success({ data: [], message: "No bookmarks found" }));
      }

      const transformedBookmarks = bookmarks
        .map(({ projectId, ...rest }: { projectId: any; [key: string]: any }) => {
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
  }

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

    const user = await User.findById(userId);
    if (!user) {
      next(new AppError("User not found", 404));
      return;
    }

    try {
      const bookmark = await Bookmark.findOne({
        userId,
        projectId,
      });

      res.status(200).json(
        success({
          data: !!bookmark,
          message: bookmark
            ? "User has bookmarked the project"
            : "User has not bookmarked the project",
        })
      );
    } catch (error) {
      logger.error(`Error checking bookmark status: ${error}`);
      next(new AppError("Error checking bookmark status", 500));
    }
  } 
}

export default BookmarkController;
