import { Types } from "mongoose";
import DbService from ".";
import Like from "../models/others/likes.model";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import { ILike } from "../types/others";
import { redisClient, invalidateCache } from "../redis/redisClient";
import logger from "../config/logger";

class LikesService {
  private dbService = new DbService<ILike>(Like);
  private CACHE_EXPIRATION = 3600; // 1 hour

  // Cache key generation methods
  private getLikesKey(projectId: string): string {
    return `likes:${projectId}`;
  }

  private getUserLikeStatusKey(userId: string, projectId: string): string {
    return `like:${userId}:${projectId}`;
  }

  private getLikedProjectsKey(userId: string): string {
    return `likedProjects:${userId}`;
  }

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

      // Invalidate cache since data has changed
      await this.invalidateLikeCache(projectId, userId);

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

    // Invalidate cache since data has changed
    await this.invalidateLikeCache(projectId, userId);

    return { liked: true };
  }

  // Fetch likes for a project
  async getLikes(projectId: string) {
    const cacheKey = this.getLikesKey(projectId);

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const likes = await this.dbService.findAll({ projectId });

    await redisClient.set(cacheKey, JSON.stringify(likes), {
      EX: this.CACHE_EXPIRATION,
    });

    return likes;
  }

  // Check if a user has liked a project
  async hasUserLiked(projectId: string, userId: string) {
    const cacheKey = this.getUserLikeStatusKey(userId, projectId);

    const cachedValue = await redisClient.get(cacheKey);
    if (cachedValue !== null) {
      return cachedValue === "true";
    }

    const like = await this.dbService.findOne({
      projectId,
      "likedBy.userId": userId,
    });

    const isLiked = !!like;
    await redisClient.set(cacheKey, isLiked ? "true" : "false", {
      EX: this.CACHE_EXPIRATION,
    });

    return isLiked;
  }

  // Fetch projects liked by a user
  async getProjectsLikedByUser(userId: string) {
    const cacheKey = this.getLikedProjectsKey(userId);

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const likedProjects = await this.dbService.findAll(
      { "likedBy.userId": userId },
      "projectId",
    );

    const projectIds = likedProjects.map((like) => like.projectId);

    const projects = await Project.find({ _id: { $in: projectIds } })
      .select(
        "title thumbnail stats creator collaborators featured publishedAt status",
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

    await redisClient.set(cacheKey, JSON.stringify(projects), {
      EX: this.CACHE_EXPIRATION,
    });

    return projects;
  }

  // Invalidate all relevant caches when like data changes
  private async invalidateLikeCache(projectId: string, userId: string) {
    await invalidateCache(this.getLikesKey(projectId));
    await invalidateCache(this.getUserLikeStatusKey(userId, projectId));
    await invalidateCache(this.getLikedProjectsKey(userId));
  }
}

export default new LikesService();
