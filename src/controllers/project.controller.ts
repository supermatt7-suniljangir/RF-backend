import { Request, Response, NextFunction } from "express";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import logger from "../logs/logger";
import { AppError, success } from "../utils/responseTypes";
import { Types } from "mongoose";

class ProjectController {
  public async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    const user = await User.findById(req.user?._id);
    if (!user) {
      next(new AppError("User not found", 404));
      return;
    }

    try {
      const projectData = req.body;
      projectData.creator = user._id;
      const project = await Project.create(projectData);

      res
        .status(201)
        .json(success({ data: project, message: "Project created" }));
    } catch (error: any) {
      logger.error(`Error creating project: ${error.message}`);

      if (error.code === 11000) {
        next(new AppError("A project with this slug already exists", 400));
        return;
      }

      next(new AppError("Error creating project", 500));
    }
  }

  public async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.params.id) {
      next(new AppError("Project ID is required", 400));
      return;
    }

    if (!req.user) {
      next(new AppError("User not authenticated", 401));
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      next(new AppError("User not found", 404));
      return;
    }

    let project = await Project.findOne({ _id: req.params.id });
    if (!project) {
      next(new AppError("Project not found", 404));
      return;
    }

    try {
      project = await Project.findByIdAndUpdate(
        project._id,
        { ...req.body, updatedAt: new Date() },
        { new: true }
      ).populate(["creator", "collaborators"]);

      if (!project) {
        next(new AppError("Error updating project", 500));
        return;
      }

      res
        .status(200)
        .json(success({ data: project, message: "Project updated" }));
    } catch (error: any) {
      logger.error(`Error updating project: ${error.message}`);
      next(new AppError("Error updating project", 500));
    }
  }

  public async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;

    try {
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
        next(new AppError("Project not found", 404));
        return;
      }

      if (project.status === "published") {
        await Project.findByIdAndUpdate(id, { $inc: { "stats.views": 1 } });
      }

      res
        .status(200)
        .json(success({ data: project, message: "Project fetched" }));
    } catch (error: any) {
      logger.error(`Error fetching project: ${error.message}`);
      next(new AppError("Error fetching project", 500));
    }
  }

  public async checkProjectOwnership(
    projectId: string,
    userId: Types.ObjectId
  ): Promise<boolean> {
    const project = await Project.findOne({
      _id: projectId,
      creator: userId,
    });
    return !!project;
  }

  public async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await Project.find({ status: "published" })
        .select("title thumbnail stats creator featured publishedAt status")
        .limit(10)
        .populate(
          "creator",
          "fullName profile.avatar profile.profession profile.availableForHire email"
        );

      res
        .status(200)
        .json(success({ data: projects, message: "Projects fetched" }));
    } catch (error: any) {
      logger.error(`Error fetching projects: ${error.message}`);
      next(new AppError("Failed to fetch projects", 500));
    }
  }

  public async getProjectsByUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { userId: paramUserId } = req.params;
    const user = req.user;

    const targetUserId =
      paramUserId === "personal" ? user?._id?.toString() : paramUserId;
    logger.info("Target userId is", targetUserId);

    const validatedUserId = Types.ObjectId.isValid(targetUserId as any)
      ? new Types.ObjectId(targetUserId)
      : null;

    if (!validatedUserId) {
      next(new AppError("Authentication required to fetch projects", 401));
      return;
    }

    try {
      const isOwnProfile = user?._id?.toString() === validatedUserId.toString();

      const projects = await Project.find({
        creator: validatedUserId,
        ...(isOwnProfile ? {} : { status: "published" }),
      })
        .select(
          "title thumbnail stats creator collaborators featured publishedAt status"
        )
        .populate({
          path: "creator",
          select:
            "email profile.avatar profile.profession profile.availableForHire fullName",
        })
        .populate({
          path: "collaborators",
          select:
            "email profile.avatar profile.profession profile.availableForHire fullName",
        })
        .lean()
        .exec();

      logger.info("Projects found:", projects);

      res.status(200).json(
        success({
          data: projects,
          message: "User projects fetched successfully",
        })
      );
    } catch (error: any) {
      logger.error(`Error fetching user projects: ${error.message}`);
      next(new AppError("Error fetching user projects", 500));
    }
  }
}

export default ProjectController;
