import { Types } from "mongoose";
import DbService from "./";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import { ProjectDocument, ProjectType } from "../types/project";

class ProjectService {
  private dbService = new DbService<ProjectDocument>(Project);

  // Create a new project
  async createProject(userId: string, projectData: Partial<ProjectDocument>) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    projectData.creator = userId;
    const project = await this.dbService.create(projectData);

    return project;
  }

  // Update a project
  async updateProject(projectId: string, updates: Partial<ProjectType>) {
    const project = await this.dbService.update(projectId, {
      ...updates,
      updatedAt: new Date(),
    });

    if (!project) throw new Error("Project not found");

    return project;
  }

  // Get a project by ID
  async getProjectById(projectId: string) {
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

    return project;
  }

  // Check if a user owns a project
  async checkProjectOwnership(projectId: string, userId: Types.ObjectId) {
    const project = await this.dbService.findOne({
      _id: projectId,
      creator: userId,
    });
    return !!project;
  }

  // Get all published projects
  async getPublishedProjects(limit = 10) {
    return Project.find({ status: "published" })
      .select("title thumbnail stats creator featured publishedAt status")
      .limit(limit)
      .populate(
        "creator",
        "fullName profile.avatar profile.profession profile.availableForHire email"
      );
  }

  // Get projects by a user
  async getProjectsByUser(userId: string, isOwnProfile = false) {
    const validatedUserId = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : null;

    if (!validatedUserId) throw new Error("Invalid user ID");

    const projects = await Project.find({
      creator: validatedUserId,
      ...(isOwnProfile ? {} : { status: "published" }),
    })
      .select(
        "title thumbnail stats creator collaborators featured publishedAt status"
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

    return projects;
  }
}

export default new ProjectService();
