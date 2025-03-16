import DbService from "./";
import Bookmark from "../models/others/bookmark.model";
import { IBookmark } from "../types/others";
import Project from "../models/project/project.model";
import { redisClient, invalidateCache } from "../redis/redisClient";

class BookmarkService {
  private dbService = new DbService<IBookmark>(Bookmark);
  private CACHE_EXPIRATION = 3600; // 1 hour

  // Generic cache key methods
  private getUserBookmarksKey(userId: string): string {
    return `bookmarks:${userId}`;
  }

  private getBookmarkStatusKey(userId: string, projectId: string): string {
    return `bookmark:${userId}:${projectId}`;
  }

  // Toggle bookmark
  async toggleBookmark(userId: string, projectId: string) {
    const bookmarkExists = await this.dbService.findOne({ userId, projectId });
    // Invalidate caches since data has changed
    await invalidateCache(this.getUserBookmarksKey(userId));
    await invalidateCache(this.getBookmarkStatusKey(userId, projectId));
    if (bookmarkExists) {
      await this.dbService.delete(bookmarkExists._id);
      return { bookmarked: false };
    } else {
      const newBookmark = await this.dbService.create({ userId, projectId });

      return { bookmarked: true, bookmark: newBookmark };
    }
  }

  // Get user bookmarks
  async getUserBookmarks(userId: string) {
    const cacheKey = this.getUserBookmarksKey(userId);

    // Try fetching from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Cache miss → Fetch from DB
    const bookmarks = await this.dbService.findAll({ userId }, "projectId");
    const projectIds = bookmarks.map((bookmark) => bookmark.projectId);

    const projects = await Project.find({ _id: { $in: projectIds } })
      .select(
        "title thumbnail stats creator collaborators featured publishedAt status",
      )
      .populate({
        path: "creator",
        select:
          "fullName email profile.avatar profile.profession profile.availableForHire followingCount followersCount",
      })
      .populate({
        path: "collaborators",
        select:
          "fullName email profile.avatar profile.profession profile.availableForHire followingCount followersCount",
      })
      .lean();

    // Store in cache
    await redisClient.set(cacheKey, JSON.stringify(projects), {
      EX: this.CACHE_EXPIRATION,
    });

    return projects;
  }

  // Check if user has bookmarked a project
  async hasUserBookmarkedProject(userId: string, projectId: string) {
    const cacheKey = this.getBookmarkStatusKey(userId, projectId);

    // Try fetching from cache
    const cachedValue = await redisClient.get(cacheKey);
    if (cachedValue !== null) {
      return cachedValue === "true";
    }

    const bookmark = await this.dbService.findOne({ userId, projectId });
    const isBookmarked = !!bookmark;

    // Store in cache
    await redisClient.set(cacheKey, isBookmarked ? "true" : "false", {
      EX: this.CACHE_EXPIRATION,
    });

    return isBookmarked;
  }
}

export default new BookmarkService();
