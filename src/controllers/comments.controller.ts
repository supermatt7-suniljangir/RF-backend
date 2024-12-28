import { Request, Response, NextFunction } from "express";
import asyncHandler from "../middlewares/asyncHanlder";
import { AppError } from "../middlewares/error";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import Comment from "../models/others/comments.model";
import { IComment } from "../types/others";
import logger from "../logs/logger";

export const addProjectComment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { projectId } = req.params;
    const { content } = req.body;
    const userId = req.user!._id;

    try {
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

      // Create the comment
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

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: comment,
      });
    } catch (error) {
      logger.error(`Error adding comment: ${error}`);
      return next(new AppError("Error adding comment", 500));
    }
  }
);

export const getAllComments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { projectId } = req.params; // Extract project ID from request params

    try {
      // Ensure the project exists
      const project = await Project.findById(projectId);
      if (!project) {
        logger.error(`Project not found: ${projectId}`);
        return next(new AppError("Project not found", 404));
      }

      // Fetch all comments for the project, sorted by creation date (newest first)
      const comments: IComment[] = await Comment.find({ projectId })
        .sort({ createdAt: -1 })
        .lean(); // Use lean for performance if only reading data

      res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (error) {
      logger.error(`Error fetching comments: ${error}`);
      next(new AppError("Error fetching comments", 500));
    }
  }
);

export const deleteComment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { projectId, commentId } = req.params; // Extract project and comment IDs
    const userId = req.user!._id; // Extract user ID from authenticated request

    try {
      // Ensure the project exists
      const project = await Project.findById(projectId);
      if (!project) {
        logger.error(`Project not found: ${projectId}`);
        return next(new AppError("Project not found", 404));
      }
      // Find the comment and ensure it exists
      const comment = await Comment.findById(commentId);
      if (!comment) {
        logger.error(`Comment not found: ${commentId}`);
        return next(new AppError("Comment not found", 404));
      }
      // Delete the comment
      await comment.deleteOne();

      // Decrement the comment count in the project's stats
      project.stats.comments = Math.max(0, project.stats.comments - 1); // Ensure stats don't go negative
      await project.save();

      res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      logger.error(`Error deleting comment: ${error}`);
      next(new AppError("Error deleting comment", 500));
    }
  }
);
