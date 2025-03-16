import { Types } from "mongoose";
import DbService from "./";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import { ProjectDocument, ProjectType } from "../types/project";
import { invalidateCache, redisClient } from "../redis/redisClient";
import logger from "../config/logger";

class ProjectService {
  private dbService = new DbService<ProjectDocument>(Project);
  private CACHE_EXPIRATION = 3600; // 1 hour

  // Generic cache key methods
  private getProjectKey(projectId: string): string {
    return `project:${projectId}`;
  }

  private getUserProjectsKey(
    userId: string,
    isOwnProfile: boolean = false,
  ): string {
    return `user:${userId}:projects:${isOwnProfile}`;
  }

  private getProjectOwnershipKey(
    projectId: string,
    userId: Types.ObjectId,
  ): string {
    return `ownership:${projectId}:${userId}`;
  }

  private getPublishedProjectsKey(limit: number): string {
    return `projects:published:${limit}`;
  }

  // Create a new project
  async createProject(userId: string, projectData: Partial<ProjectDocument>) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    projectData.creator = userId;
    const project = await this.dbService.create(projectData);

    // Invalidate cache since data has changed
    await invalidateCache(this.getUserProjectsKey(userId));

    return project;
  }

  // Update a project
  async updateProject(projectId: string, updates: Partial<ProjectType>) {
    const project = await this.dbService.update(projectId, {
      ...updates,
      updatedAt: new Date(),
    });

    if (!project) throw new Error("Project not found");

    // Invalidate cache since project data has changed
    await invalidateCache(this.getProjectKey(projectId));
    await invalidateCache(this.getUserProjectsKey(project.creator.toString()));

    return project;
  }

  // Get a project by ID
  async getProjectById(projectId: string) {
    const cacheKey = this.getProjectKey(projectId);

    // Try fetching from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const project = await Project.findById(projectId)
      .populate({
        path: "creator",
        select:
          "fullName profile.avatar profile.profession profile.availableForHire email followersCount followingCount",
      })
      .populate({
        path: "collaborators",
        select:
          "fullName profile.avatar profile.profession profile.availableForHire email followersCount followingCount",
      })
      .populate({
        path: "tools",
        select: "name icon",
      });

    if (!project) throw new Error("Project not found");

    if (project.status === "published") {
      await Project.findByIdAndUpdate(projectId, {
        $inc: { "stats.views": 1 },
      });
    }

    // Cache project data
    await redisClient.set(cacheKey, JSON.stringify(project), {
      EX: this.CACHE_EXPIRATION,
    });

    return project;
  }

  // Check if a user owns a project
  async checkProjectOwnership(projectId: string, userId: Types.ObjectId) {
    const cacheKey = this.getProjectOwnershipKey(projectId, userId);

    // Try fetching from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const project = await this.dbService.findOne({
      _id: projectId,
      creator: userId,
    });

    const isOwner = !!project;

    // Cache ownership data
    await redisClient.set(cacheKey, JSON.stringify(isOwner), {
      EX: this.CACHE_EXPIRATION,
    });

    return isOwner;
  }

  // Get all published projects
  async getPublishedProjects(limit = 10) {
    const cacheKey = this.getPublishedProjectsKey(limit);

    // Try fetching from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const projects = await Project.find({ status: "published" })
      .select("title thumbnail stats creator featured publishedAt status")
      .limit(limit)
      .populate(
        "creator",
        "fullName profile.avatar profile.profession profile.availableForHire email",
      )
      .lean();

    // Cache published projects
    await redisClient.set(cacheKey, JSON.stringify(projects), {
      EX: this.CACHE_EXPIRATION,
    });

    return projects;
  }

  // Get projects by a user
  async getProjectsByUser(userId: string, isOwnProfile = false) {
    const validatedUserId = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : null;

    if (!validatedUserId) throw new Error("Invalid user ID");

    const cacheKey = this.getUserProjectsKey(userId, isOwnProfile);

    // Try fetching from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const projects = await Project.find({
      creator: validatedUserId,
      ...(isOwnProfile ? {} : { status: "published" }),
    })
      .select(
        "title thumbnail stats creator collaborators featured publishedAt status",
      )
      .populate({
        path: "creator",
        select: "email profile.avatar fullName",
      })
      .populate({
        path: "collaborators",
        select: "email profile.avatar fullName",
      })
      .lean();

    // Cache user projects
    await redisClient.set(cacheKey, JSON.stringify(projects), {
      EX: this.CACHE_EXPIRATION,
    });

    return projects;
  }

  // Delete a project
  async deleteProject(projectId: string) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    const userId = project.creator.toString();
    const deleted = await this.dbService.delete(projectId);

    if (!deleted) throw new Error("Failed to delete project");

    // Invalidate cache since data has changed
    await invalidateCache(this.getProjectKey(projectId));
    await invalidateCache(this.getUserProjectsKey(userId));

    return true;
  }
}

export default new ProjectService();
