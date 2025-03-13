import DbService from "./";
import Comment from "../models/others/comments.model";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import {IComment} from "../types/others";
import {redisClient, invalidateCache} from "../redis/redisClient";
import logger from "../config/logger";

class CommentService {
    private dbService = new DbService<IComment>(Comment);
    private CACHE_EXPIRATION = 3600; // 1 hour

    // Cache key generation method
    private getCommentsKey(projectId: string): string {
        return `comments:${projectId}`;
    }

    // Add a comment to a project
    async addComment(projectId: string, userId: string, content: string) {
        const project = await Project.findById(projectId);
        if (!project) throw new Error("Project not found");

        const user = await User.findById(userId, "fullName profile.avatar");
        if (!user) throw new Error("User not found");

        const comment = await this.dbService.create({
            content,
            projectId,
            author: {
                userId,
                fullName: user.fullName,
                avatar: user.profile?.avatar,
            },
        });

        project.stats.comments = Math.max(0, project.stats.comments + 1);
        await project.save();

        // Invalidate cache since data has changed
        await invalidateCache(this.getCommentsKey(projectId));

        return comment;
    }

    // Get all comments for a project
    async getComments(projectId: string) {
        const cacheKey = this.getCommentsKey(projectId);

        // Try fetching from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            logger.debug("Cache hit for project comments");
            return JSON.parse(cachedData);
        }

        logger.debug("Cache miss for project comments, fetching from DB");

        // Cache miss → Fetch from DB
        const comments = await Comment.find({projectId})
            .sort({createdAt: -1})
            .lean();

        // Store in cache
        await redisClient.set(cacheKey, JSON.stringify(comments), {EX: this.CACHE_EXPIRATION});
        logger.debug("Cached project comments");

        return comments;
    }

    // Delete a comment
    async deleteComment(projectId: string, commentId: string, userId: string) {
        const project = await Project.findById(projectId);
        if (!project) throw new Error("Project not found");

        const comment = await this.dbService.findById(commentId);
        if (!comment) throw new Error("Comment not found");

        await this.dbService.delete(commentId);

        project.stats.comments = Math.max(0, project.stats.comments - 1);
        await project.save();

        // Invalidate cache since data has changed
        await invalidateCache(this.getCommentsKey(projectId));

        return true;
    }
}

export default new CommentService();