import { Request, Response, NextFunction, RequestHandler } from "express";
import asyncHandler from "../middlewares/asyncHanlder";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import logger from "../logs/logger";
import { AppError, success } from "../utils/responseTypes";
import { Types } from "mongoose";

class ProjectController {
  // Create a new project
  public createProject = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<Response | void> => {
      try {
        const user = await User.findById(req.user?._id);
        if (!user) {
          return next(new AppError("User not found", 404));
        }
        const projectData = req.body;
        projectData.creator = user._id;
        const project = await Project.create(projectData);

        return res
          .status(201)
          .json(success({ data: project, message: "Project created" }));
      } catch (error: any) {
        logger.error(`Error creating project: ${error.message}`);
        if (error.code === 11000) {
          return next(
            new AppError("A project with this slug already exists", 400)
          );
        }
        return next(new AppError("Error creating project", 500));
      }
    }
  ) as RequestHandler;

  // Update a project
  public updateProject = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<Response | void> => {
      try {
        if (!req.params.id) {
          return next(new AppError("Project ID is required", 400));
        }
        if (!req.user) {
          return next(new AppError("User not authenticated", 401));
        }

        let project = await Project.findOne({ _id: req.params.id });
        const user = await User.findById(req.user._id);

        if (!user) {
          return next(new AppError("User not found", 404));
        }
        if (!project) {
          return next(new AppError("Project not found", 404));
        }

        project = await Project.findByIdAndUpdate(
          project._id,
          { ...req.body, updatedAt: new Date() },
          { new: true }
        ).populate(["creator", "collaborators"]);

        if (!project) {
          return next(new AppError("Error updating project", 500));
        }

        return res
          .status(200)
          .json(success({ data: project, message: "Project updated" }));
      } catch (error: any) {
        logger.error(`Error updating project: ${error.message}`);
        return next(new AppError("Error updating project", 500));
      }
    }
  ) as RequestHandler;

  // Get project by ID
  public getProjectById = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<Response | void> => {
      try {
        const { id } = req.params;
        const project = await Project.findById(id)
          .populate({
            path: "creator",
            select:
              "fullName profile.avatar profile.profession profile.availableForHire email",
          })
          .populate({
            path: "collaborators",
            select:
              "fullName profile.avatar profile.profession profile.availableForHire email",
          })
          .populate({
            path: "tools",
            select: "name icon",
          });

        if (!project) {
          return next(new AppError("Project not found", 404));
        }
        if (project.status === "published") {
          await Project.findByIdAndUpdate(id, { $inc: { "stats.views": 1 } });
        }

        return res
          .status(200)
          .json(success({ data: project, message: "Project fetched" }));
      } catch (error: any) {
        logger.error(`Error fetching project: ${error.message}`);
        return next(new AppError("Error fetching project", 500));
      }
    }
  ) as RequestHandler;

  // Check project ownership
  public checkProjectOwnership = async (
    projectId: string,
    userId: Types.ObjectId
  ): Promise<boolean> => {
    const project = await Project.findOne({
      _id: projectId,
      creator: userId,
    });

    return !!project;
  };
  // Get all published projects
  public getProjects = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<Response | void> => {
      try {
        const projects = await Project.find({ status: "published" })
          .select("title thumbnail stats creator featured publishedAt status")
          .limit(10)
          .populate(
            "creator",
            "fullName profile.avatar profile.profession profile.availableForHire email"
          );

        return res
          .status(200)
          .json(success({ data: projects, message: "Projects fetched" }));
      } catch (error: any) {
        logger.error(`Error fetching projects: ${error.message}`);
        return next(new AppError("Failed to fetch projects", 500));
      }
    }
  ) as RequestHandler;

  public getProjectsByUser = asyncHandler(
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            const { userId: paramUserId } = req.params;
            const user = req.user;

            // Determine the target user ID
            const targetUserId = paramUserId === "personal" ? user?._id?.toString() : paramUserId;

            logger.info("Target userId is", targetUserId);

            // Validate the target user ID
            const validatedUserId = Types.ObjectId.isValid(targetUserId as any)
                ? new Types.ObjectId(targetUserId)
                : null;

            if (!validatedUserId) {
                return next(
                    new AppError("Authentication required to fetch projects", 401)
                );
            }

            // Check if the request is for the authenticated user's own projects
            const isOwnProfile = user?._id?.toString() === validatedUserId.toString();

            // Fetch the user's projects
            const projects = await Project.find({
                creator: validatedUserId,
                ...(isOwnProfile ? {} : { status: "published" }),
            })
                .select(
                    "title thumbnail stats creator collaborators featured publishedAt status"
                )
                .populate({
                    path: "creator",
                    select: "email profile.avatar profile.profession profile.availableForHire fullName",
                })
                .populate({
                    path: "collaborators",
                    select: "email profile.avatar profile.profession profile.availableForHire fullName",
                })
                .lean()
                .exec();

            logger.info("Projects found:", projects);

            return res.status(200).json(
                success({
                    data: projects,
                    message: "User projects fetched successfully",
                })
            );
        } catch (error: any) {
            logger.error(`Error fetching user projects: ${error.message}`);
            return next(new AppError("Error fetching user projects", 500));
        }
    }
) as RequestHandler;

}

export default ProjectController;
