import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";
import { AppError, success } from "../utils/responseTypes";
import ProjectService from "../services/ProjectService";

class ProjectController {
  // Create a new project
  static async createProject(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        next(new AppError("User not authenticated", 401));
        return;
      }

      const project = await ProjectService.createProject(userId, req.body);

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

  // Update a project
  static async updateProject(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const projectId = req.params.id;
      if (!projectId) {
        next(new AppError("Project ID is required", 400));
        return;
      }

      const userId = req.user?._id;
      if (!userId) {
        next(new AppError("User not authenticated", 401));
        return;
      }

      const project = await ProjectService.updateProject(projectId, req.body);

      res
        .status(200)
        .json(success({ data: project, message: "Project updated" }));
    } catch (error: any) {
      logger.error(`Error updating project: ${error.message}`);
      next(new AppError("Error updating project", 500));
    }
  }

  // Get a project by ID
  static async getProjectById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const projectId = req.params.id;
      if (!projectId) {
        next(new AppError("Project ID is required", 400));
        return;
      }

      const project = await ProjectService.getProjectById(projectId);

      res
        .status(200)
        .json(success({ data: project, message: "Project fetched" }));
    } catch (error: any) {
      logger.error(`Error fetching project: ${error.message}`);
      next(new AppError("Error fetching project", 500));
    }
  }

  // Get all published projects
  static async getProjects(
    _: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const projects = await ProjectService.getPublishedProjects();

      res
        .status(200)
        .json(success({ data: projects, message: "Projects fetched" }));
    } catch (error: any) {
      logger.error(`Error fetching projects: ${error.message}`);
      next(new AppError("Failed to fetch projects", 500));
    }
  }

  // Get projects by a user
  static async getProjectsByUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId: paramUserId } = req.params;
      const user = req.user;
      if (!user && paramUserId === "personal") {
        next(new AppError("User not authenticated", 401));
        return;
      }

      const targetUserId =
        paramUserId === "personal" ? user!._id?.toString() : paramUserId;

      if (!targetUserId) {
        next(new AppError("User ID is required", 400));
        return;
      }
      const isOwnProfile = user?._id.toString() === targetUserId;

      const projects = await ProjectService.getProjectsByUser(
        targetUserId,
        isOwnProfile,
      );

      res.status(200).json(
        success({
          data: projects,
          message: "User projects fetched successfully",
        }),
      );
    } catch (error: any) {
      logger.error(`Error fetching user projects: ${error.message}`);
      next(new AppError("Error fetching user projects", 500));
    }
  }

  static async deleteProject(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        next(new AppError("User not authenticated", 401));
        return;
      }
      const { id } = req.params;
      if (!id) {
        next(new AppError("Project ID is required", 400));
        return;
      }
      // Find the project first to check ownership
      const project: any = await ProjectService.getProjectById(id);
      if (!project) {
        next(new AppError("Project not found", 404));
        return;
      }

      if (project.creator._id.toString() !== userId.toString()) {
        next(
          new AppError("You are not authorized to delete this project", 403),
        );
        return;
      }

      // Delete the project
      await ProjectService.deleteProject(id);

      res
        .status(200)
        .json(success({ message: "Project deleted successfully", data: true }));
    } catch (error: any) {
      logger.error(`Error deleting project: ${error.message}`);
      next(new AppError("Error deleting project", 500));
    }
  }
}

export default ProjectController;
