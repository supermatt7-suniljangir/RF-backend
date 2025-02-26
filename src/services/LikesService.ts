import { Types } from "mongoose";
import DbService from ".";
import Like from "../models/others/likes.model";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import { ILike } from "../types/others";

class LikesService {
  private dbService = new DbService<ILike>(Like);

  // Toggle like/unlike a project
  async toggleLike(projectId: string, userId: string) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    const user = await User.findById(userId, "fullName profile.avatar");
    if (!user) throw new Error("User not found");

    const existingLike = await this.dbService.findOne({
      projectId,
      "likedBy.userId": userId,
    });

    if (existingLike) {
      await this.dbService.delete(existingLike._id);
      project.stats.likes = Math.max(0, project.stats.likes - 1);
      await project.save();
      return { liked: false };
    }

    await this.dbService.create({
      projectId,
      likedBy: {
        userId,
        fullName: user.fullName,
        avatar: user.profile?.avatar,
      },
    });

    project.stats.likes += 1;
    await project.save();

    return { liked: true };
  }

  // Fetch likes for a project
  async getLikes(projectId: string) {
    return this.dbService.findAll({ projectId });
  }

  // Check if a user has liked a project
  async hasUserLiked(projectId: string, userId: string) {
    const like = await this.dbService.findOne({
      projectId,
      "likedBy.userId": userId,
    });
    return !!like;
  }

  // Fetch projects liked by a user
  async getProjectsLikedByUser(userId: string) {
    const likedProjects = await this.dbService.findAll(
      { "likedBy.userId": userId },
      "projectId"
    );

    const projectIds = likedProjects.map((like) => like.projectId);

    return Project.find({ _id: { $in: projectIds } })
      .select(
        "title thumbnail stats creator collaborators featured publishedAt status"
      )
      .populate({
        path: "creator",
        select: "fullName email profile.avatar",
      })
      .populate({
        path: "collaborators",
        select: "fullName email profile.avatar",
      })
      .lean();
  }
}

export default new LikesService();
