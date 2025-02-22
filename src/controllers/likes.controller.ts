import { Request, Response, NextFunction, RequestHandler } from "express";
import Like from "../models/others/likes.model";
import Project from "../models/project/project.model";
import logger from "../logs/logger";
import User from "../models/user/user.model";
import { AppError, success } from "../utils/responseTypes";
import asyncHandler from "../middlewares/asyncHanlder";
import { Types } from "mongoose";

class LikesController {
  public toggleLikeProject = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      try {
        const { projectId } = req.params;
        const userId = req.user!._id;

        // Ensure the project exists
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

          return res
            .status(200)
            .json(success({ data: false, message: "Project unliked" }));
        } else {
          // Add a new like
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

          return res
            .status(200)
            .json(success({ data: true, message: "Project liked" }));
        }
      } catch (error) {
        logger.error("Error toggling like:", error);
        return next(new AppError("Error toggling like", 500));
      }
    }
  ) as RequestHandler;

  public fetchProjectLikes = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<Response | void> => {
      try {
        const { projectId } = req.params;

        const likes = await Like.find({ projectId });
        return res.status(200).json(
          success({
            data: likes,
            message: "Likes fetched successfully",
          })
        );
      } catch (error) {
        logger.error("Error fetching project likes:", error);
        return next(new AppError("Error fetching project likes", 500));
      }
    }
  ) as RequestHandler;

  public hasUserLikedProject = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      try {
        const { projectId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
          return res.status(200).json(
            success({
              data: false,
              message: "User not logged in",
            })
          );
        }

        const user = await User.findById(userId);
        if (!user) {
          return next(new AppError("User not found", 404));
        }

        const like = await Like.findOne({
          projectId,
          "likedBy.userId": userId,
        });

        if (like) {
          return res.status(200).json(
            success({
              data: true,
              message: "User has liked the project",
            })
          );
        }

        return res.status(200).json(
          success({
            data: false,
            message: "User has not liked the project",
          })
        );
      } catch (error) {
        logger.error("Error checking like status:", error);
        return next(new AppError("Error checking like status", 500));
      }
    }
  ) as RequestHandler;

  public fetchProjectsLikedByUser = asyncHandler(
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void | Response> => {
        try {
            const { userId } = req.params;
            const user = req.user;

            if (!userId) {
                return next(new AppError("Missing user ID", 400));
            }

            // Handle "personal" case securely
            const targetUserId = userId === "personal" ? user?._id.toString() : userId;

            if (!targetUserId) {
                return next(new AppError("User not authenticated", 401));
            }

            // Fetch all project IDs liked by the user
            const likedProjects = await Like.find({ "likedBy.userId": targetUserId })
                .select("projectId")
                .lean()
                .exec();

            if (!likedProjects.length) {
                return res.status(200).json(
                    success({
                        data: [],
                        message: "No projects liked by the user",
                    })
                );
            }

            const projectIds = likedProjects.map((like) => like.projectId);

            // Fetch mini project data for the liked projects
            const projects = await Project.find({ _id: { $in: projectIds } })
                .select(
                    "title thumbnail stats creator collaborators featured publishedAt status"
                )
                .populate({
                    path: "creator",
                    select: "fullName email profile.avatar profile.profession",
                })
                .populate({
                    path: "collaborators",
                    select: "fullName email profile.profession profile.avatar",
                })
                .lean()
                .exec();

            return res.status(200).json(
                success({
                    data: projects,
                    message: "Projects liked by the user fetched successfully",
                })
            );
        } catch (error: any) {
            logger.error("Error fetching projects liked by user:", error.message);
            return next(new AppError("Error fetching projects liked by user", 500));
        }
    }
) as RequestHandler;

}

export default LikesController;
