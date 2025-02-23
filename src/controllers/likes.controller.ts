import { Request, Response, NextFunction } from "express";
import Like from "../models/others/likes.model";
import Project from "../models/project/project.model";
import logger from "../logs/logger";
import User from "../models/user/user.model";
import { AppError, success } from "../utils/responseTypes";
import { Types } from "mongoose";

class LikesController {
  static async toggleLikeProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { projectId } = req.params;
    const userId = req.user!._id;

    const project = await Project.findById(projectId);
    if (!project) {
      logger.error(`Project not found: ${projectId}`);
      next(new AppError("Project not found", 404));
      return;
    }

    const user = await User.findById(userId, "fullName profile.avatar");
    if (!user) {
      logger.error(`User not found: ${userId}`);
      next(new AppError("User not found", 404));
      return;
    }

    try {
      const existingLike = await Like.findOne({
        projectId,
        "likedBy.userId": userId,
      });

      if (existingLike) {
        await existingLike.deleteOne();
        project.stats.likes = Math.max(0, project.stats.likes - 1);
        await project.save();

        res
          .status(200)
          .json(success({ data: false, message: "Project unliked" }));
        return;
      }

      await Like.create({
        projectId,
        likedBy: {
          userId,
          fullName: user.fullName,
          avatar: user.profile?.avatar || null,
        },
      });
      project.stats.likes += 1;
      await project.save();

      res.status(200).json(success({ data: true, message: "Project liked" }));
    } catch (error) {
      logger.error("Error toggling like:", error);
      next(new AppError("Error toggling like", 500));
    }
  }

  static async fetchProjectLikes(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { projectId } = req.params;

    try {
      const likes = await Like.find({ projectId });
      res.status(200).json(
        success({
          data: likes,
          message: "Likes fetched successfully",
        })
      );
    } catch (error) {
      logger.error("Error fetching project likes:", error);
      next(new AppError("Error fetching project likes", 500));
    }
  }

  static async hasUserLikedProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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
      const like = await Like.findOne({
        projectId,
        "likedBy.userId": userId,
      });

      if (like) {
        res.status(200).json(
          success({
            data: true,
            message: "User has liked the project",
          })
        );
        return;
      }

      res.status(200).json(
        success({
          data: false,
          message: "User has not liked the project",
        })
      );
    } catch (error) {
      logger.error("Error checking like status:", error);
      next(new AppError("Error checking like status", 500));
    }
  }

  static async fetchProjectsLikedByUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { userId } = req.params;
    const user = req.user;

    if (!userId) {
      next(new AppError("Missing user ID", 400));
      return;
    }

    const targetUserId = userId === "personal" ? user?._id.toString() : userId;

    if (!targetUserId) {
      next(new AppError("User not authenticated", 401));
      return;
    }

    try {
      const likedProjects = await Like.find({ "likedBy.userId": targetUserId })
        .select("projectId")
        .lean()
        .exec();

      if (!likedProjects.length) {
        res.status(200).json(
          success({
            data: [],
            message: "No projects liked by the user",
          })
        );
        return;
      }

      const projectIds = likedProjects.map((like) => like.projectId);

      const projects = await Project.find({ _id: { $in: projectIds } })
        .select(
          "title thumbnail stats creator collaborators featured publishedAt status"
        )
        .populate({
          path: "creator",
          select:
            "fullName email profile.avatar profile.profession profile.profession",
        })
        .populate({
          path: "collaborators",
          select:
            "fullName email profile.profession profile.avatar profile.profession",
        })
        .lean()
        .exec();

      res.status(200).json(
        success({
          data: projects,
          message: "Projects liked by the user fetched successfully",
        })
      );
    } catch (error: any) {
      logger.error("Error fetching projects liked by user:", error.message);
      next(new AppError("Error fetching projects liked by user", 500));
    }
  }
}

export default LikesController;
