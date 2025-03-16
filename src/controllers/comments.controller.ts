import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";
import { AppError, success } from "../utils/responseTypes";
import CommentService from "../services/CommentsService";

class CommentController {
  // Add a comment to a project
  static async addProjectComment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const { content } = req.body;
      const userId = req.user!._id;

      if (!content || content.trim().length === 0) {
        logger.error("Comment content is required");
        next(new AppError("Comment content is required", 400));
        return;
      }

      const comment = await CommentService.addComment(
        projectId,
        userId,
        content,
      );

      res.status(201).json(
        success({
          data: comment,
          message: "Comment added successfully",
        }),
      );
    } catch (error: any) {
      logger.error("Error adding comment:", error);
      next(new AppError(error.message, 500));
    }
  }

  // Get all comments for a project
  static async getAllComments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { projectId } = req.params;

      const comments = await CommentService.getComments(projectId);

      res.status(200).json(
        success({
          data: comments,
          message: "Comments fetched successfully",
        }),
      );
    } catch (error: any) {
      logger.error("Error fetching comments:", error);
      next(new AppError(error.message, 500));
    }
  }

  // Delete a comment
  static async deleteComment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { projectId, commentId } = req.params;
      const userId = req.user!._id;

      if (!userId) {
        logger.error("User not logged in");
        next(new AppError("User not logged in", 401));
        return;
      }

      await CommentService.deleteComment(projectId, commentId, userId);

      res.status(200).json(
        success({
          data: true,
          message: "Comment deleted successfully",
        }),
      );
    } catch (error: any) {
      logger.error("Error deleting comment:", error);
      next(new AppError(error.message, 500));
    }
  }
}

export default CommentController;
