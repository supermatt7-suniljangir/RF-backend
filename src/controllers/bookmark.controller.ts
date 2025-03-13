import {Request, Response, NextFunction} from "express";
import logger from "../config/logger";
import {AppError, success} from "../utils/responseTypes";
import User from "../models/user/user.model";
import Project from "../models/project/project.model";
import BookmarkService from "../services/BookmarkService";
import {Types} from "mongoose";

class BookmarkController {
    // Toggle Bookmark
    static toggleBookmark = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const {projectId} = req.params;
        const userId = req.user!._id;

        if (!projectId || !Types.ObjectId.isValid(projectId)) {
            logger.error(`Invalid project ID: ${projectId}`);
            next(new AppError("Invalid project ID", 400));
            return;
        }

        try {
            // Check if the project exists
            const project = await Project.findById(projectId);
            if (!project) {
                logger.error(`Project not found: ${projectId}`);
                next(new AppError("Project not found", 404));
                return;
            }

            // Toggle bookmark
            const {bookmarked} = await BookmarkService.toggleBookmark(
                userId,
                projectId
            );

            res.status(200).json(
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
                res.status(200).json(
                    success({data: [], message: "No bookmarks found"})
                );
                return;
            }

            res.status(200).json(
                success({data: bookmarks, message: "Bookmarks fetched"})
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
        const {projectId} = req.params;
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
