import { Types } from "mongoose";
import DbService from "./";
import Comment from "../models/others/comments.model";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import { IComment } from "../types/others";

class CommentService {
  private dbService = new DbService<IComment>(Comment);

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

    return comment;
  }

  // Get all comments for a project
  async getComments(projectId: string) {
    return Comment.find({ projectId }).sort({ createdAt: -1 }).lean();
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

    return true;
  }
}

export default new CommentService();
