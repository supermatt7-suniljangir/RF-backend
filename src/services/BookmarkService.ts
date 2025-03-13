import DbService from "./";
import Bookmark from "../models/others/bookmark.model";
import {IBookmark} from "../types/others";
import Project from "../models/project/project.model";
import {redisClient} from "../redis/redisClient";
import logger from "../config/logger";

class BookmarkService {
    private dbService = new DbService<IBookmark>(Bookmark);
    private CACHE_EXPIRATION = 3600; // 1 hour

    // Toggle bookmark
    async toggleBookmark(userId: string, projectId: string) {
        const bookmarkExists = await this.dbService.findOne({userId, projectId});

        if (bookmarkExists) {
            logger.debug(`Removing bookmark for user bookmark on a project`);
            await this.dbService.delete(bookmarkExists._id);

            // Invalidate cache since data has changed
            await this.invalidateCache(userId);

            return {bookmarked: false};
        } else {
            logger.debug(`Creating bookmark for user bookmark`);
            const newBookmark = await this.dbService.create({userId, projectId});

            // Invalidate cache since data has changed
            await this.invalidateCache(userId);

            return {bookmarked: true, bookmark: newBookmark};
        }
    }

    // Get user bookmarks
    async getUserBookmarks(userId: string) {
        const cacheKey = `bookmarks:${userId}`;

        // Try fetching from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log(JSON.parse(cachedData))
            logger.debug(`Cache hit for user bookmarks`);
            return JSON.parse(cachedData);
        }

        logger.debug(`Cache miss for user bookmarks, fetching from DB`);

        // Cache miss → Fetch from DB
        const bookmarks = await this.dbService.findAll({userId}, "projectId");
        const projectIds = bookmarks.map((bookmark) => bookmark.projectId);

        const projects = await Project.find({_id: {$in: projectIds}})
            .select(
                "title thumbnail stats creator collaborators featured publishedAt status"
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
        await redisClient.set(cacheKey, JSON.stringify(projects), {EX: this.CACHE_EXPIRATION});
        logger.debug(`Cached user bookmarks`);

        return projects;
    }

    // Check if user has bookmarked a project
    async hasUserBookmarkedProject(userId: string, projectId: string) {
        const cacheKey = `bookmark:${userId}:${projectId}`;

        // Try fetching from cache
        const cachedValue = await redisClient.get(cacheKey);
        if (cachedValue !== null) {
            logger.debug(`Cache hit for user bookmarks`);
            return cachedValue === 'true';
        }

        logger.debug(`Cache miss for checking user bookmark for a project, checking DB`);

        const bookmark = await this.dbService.findOne({userId, projectId});
        const isBookmarked = !!bookmark;

        // Store in cache
        await redisClient.set(cacheKey, isBookmarked ? 'true' : 'false', {EX: this.CACHE_EXPIRATION});
        logger.debug(`Cached result for checking user bookmark for a project`);

        return isBookmarked;
    }

    // Invalidate user bookmarks cache when data changes
    private async invalidateCache(userId: string) {
        logger.debug(`Invalidating cache for  bookmarks service`);
        await redisClient.del(`bookmarks:${userId}`);
    }
}

export default new BookmarkService();
