import Tool from "../models/others/tools.model";
import {redisClient, invalidateCache} from "../redis/redisClient";
import logger from "../config/logger";

class ToolService {
    private static CACHE_EXPIRATION = 3600; // 1 hour

    // Generic cache key methods
    private static getToolsListKey(): string {
        return `tools:list`;
    }

    private static getToolKey(toolId: string): string {
        return `tool:${toolId}`;
    }

    // Create a new tool
    static async createTool(name: string, icon?: string) {
        const tool = await Tool.create({name, icon});

        // Invalidate cache since data has changed
        await invalidateCache(this.getToolsListKey());
        logger.debug(`Created tool. Cache invalidated for tools list`);

        return tool;
    }

    // Get all tools
    static async getAllTools() {
        const cacheKey = this.getToolsListKey();

        // Try fetching from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            logger.debug(`Cache hit for tools list`);
            return JSON.parse(cachedData);
        }

        logger.debug(`Cache miss for tools list, fetching from DB`);

        const tools = await Tool.find().lean();

        // Cache tools list
        await redisClient.set(cacheKey, JSON.stringify(tools), {EX: this.CACHE_EXPIRATION});
        logger.debug(`Cached tools list`);

        return tools;
    }

    // Get tool by ID
    static async getToolById(toolId: string) {
        const cacheKey = this.getToolKey(toolId);

        // Try fetching from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            logger.debug(`Cache hit for tool`);
            return JSON.parse(cachedData);
        }

        logger.debug(`Cache miss for tool, fetching from DB`);

        const tool = await Tool.findById(toolId).lean();
        if (!tool) return null;

        // Cache tool data
        await redisClient.set(cacheKey, JSON.stringify(tool), {EX: this.CACHE_EXPIRATION});
        logger.debug(`Cached tool data`);

        return tool;
    }

    // Delete a tool by ID
    static async deleteTool(toolId: string) {
        const tool = await Tool.findById(toolId);
        if (!tool) return null;

        await tool.deleteOne();

        // Invalidate caches since data has changed
        await invalidateCache(this.getToolsListKey());
        await invalidateCache(this.getToolKey(toolId));
        logger.debug(`Deleted tool. Caches invalidated`);

        return tool;
    }

    // Update a tool
    static async updateTool(toolId: string, updates: { name?: string; icon?: string }) {
        const tool = await Tool.findByIdAndUpdate(
            toolId,
            {...updates},
            {new: true}
        );

        if (!tool) return null;

        // Invalidate caches since data has changed
        await invalidateCache(this.getToolsListKey());
        await invalidateCache(this.getToolKey(toolId));
        logger.debug(`Updated tool. Caches invalidated`);

        return tool;
    }
}

export default ToolService;