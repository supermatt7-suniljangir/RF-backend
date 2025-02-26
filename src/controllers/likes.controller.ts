import { Request, Response, NextFunction } from "express";
import logger from "../logs/logger";
import { AppError, success } from "../utils/responseTypes";
import LikesService from "../services/LikesService";

class LikesController {
  // Toggle like/unlike a project
  static async toggleLikeProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user!._id;

      const { liked } = await LikesService.toggleLike(projectId, userId);

      res.status(200).json(
        success({
          data: liked,
          message: liked ? "Project liked" : "Project unliked",
        })
      );
    } catch (error: any) {
      logger.error("Error toggling like:", error);
      next(new AppError(error.message, 500));
    }
  }

  // Fetch likes for a project
  static async fetchProjectLikes(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { projectId } = req.params;

      const likes = await LikesService.getLikes(projectId);

      res.status(200).json(
        success({
          data: likes,
          message: "Likes fetched successfully",
        })
      );
    } catch (error: any) {
      logger.error("Error fetching project likes:", error);
      next(new AppError(error.message, 500));
    }
  }

  // Check if a user has liked a project
  static async hasUserLikedProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
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

      const hasLiked = await LikesService.hasUserLiked(projectId, userId);

      res.status(200).json(
        success({
          data: hasLiked,
          message: hasLiked
            ? "User has liked the project"
            : "User has not liked the project",
        })
      );
    } catch (error: any) {
      logger.error("Error checking like status:", error);
      next(new AppError(error.message, 500));
    }
  }

  // Fetch projects liked by a user
  static async fetchProjectsLikedByUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const user = req.user;

      if (!userId) {
        next(new AppError("Missing user ID", 400));
        return;
      }

      const targetUserId =
        userId === "personal" ? user?._id.toString() : userId;

      if (!targetUserId) {
        next(new AppError("User not authenticated", 401));
        return;
      }

      const projects = await LikesService.getProjectsLikedByUser(targetUserId);

      res.status(200).json(
        success({
          data: projects,
          message: "Projects liked by the user fetched successfully",
        })
      );
    } catch (error: any) {
      logger.error("Error fetching projects liked by user:", error.message);
      next(new AppError(error.message, 500));
    }
  }
}

export default LikesController;
