import { Request, Response, NextFunction, RequestHandler } from "express";
import asyncHandler from "../middlewares/asyncHanlder";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import Comment from "../models/others/comments.model";
import { IComment } from "../types/others";
import logger from "../logs/logger";
import { AppError, success } from "../utils/responseTypes";

class CommentController {
  public addProjectComment = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<Response | void> => {
      try {
        const { projectId } = req.params;
        const { content } = req.body;
        const userId = req.user!._id;

        if (!content || content.trim().length === 0) {
          logger.error("Comment content is required");
          return next(new AppError("Comment content is required", 400));
        }

        const project = await Project.findById(projectId);
        if (!project) {
          logger.error(`Project not found: ${projectId}`);
          return next(new AppError("Project not found", 404));
        }

        const user = await User.findById(userId, "fullName profile.avatar");
        if (!user) {
          logger.error(`User not found: ${userId}`);
          return next(new AppError("User not found", 404));
        }

        const comment = await Comment.create({
          content,
          projectId,
          author: {
            userId,
            fullName: user.fullName,
            avatar: user.profile?.avatar || null,
          },
        });

        project.stats.comments = Math.max(0, project.stats.comments + 1);
        await project.save();

        return res.status(201).json(
          success({
            data: comment,
            message: "Comment added successfully",
          })
        );
      } catch (error) {
        logger.error("Error adding comment:", error);
        return next(new AppError("Error adding comment", 500));
      }
    }
  ) as RequestHandler;

  public getAllComments = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<Response | void> => {
      try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
          logger.error(`Project not found: ${projectId}`);
          return next(new AppError("Project not found", 404));
        }

        const comments: IComment[] = await Comment.find({ projectId })
          .sort({ createdAt: -1 })
          .lean();

        return res.status(200).json(
          success({
            data: comments,
            message: "Comments fetched successfully",
          })
        );
      } catch (error) {
        logger.error("Error fetching comments:", error);
        return next(new AppError("Error fetching comments", 500));
      }
    }
  ) as RequestHandler;

  public deleteComment = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<Response | void> => {
      try {
        const { projectId, commentId } = req.params;
        const userId = req.user!._id;
        if (!userId) {
          logger.error("User not logged in");
          return next(new AppError("User not logged in", 401));
        }

        const project = await Project.findById(projectId);
        if (!project) {
          logger.error(`Project not found: ${projectId}`);
          return next(new AppError("Project not found", 404));
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
          logger.error(`Comment not found: ${commentId}`);
          return next(new AppError("Comment not found", 404));
        }

        await comment.deleteOne();

        project.stats.comments = Math.max(0, project.stats.comments - 1);
        await project.save();

        return res.status(200).json(
          success({
            data: true,
            message: "Comment deleted successfully",
          })
        );
      } catch (error) {
        logger.error("Error deleting comment:", error);
        return next(new AppError("Error deleting comment", 500));
      }
    }
  ) as RequestHandler;
}

export default CommentController;
