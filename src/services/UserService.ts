import DbService from "./";
import { FilterQuery, UpdateQuery } from "mongoose";
import { UserDocument } from "../types/user";
import User from "../models/user/user.model";
import { redisClient, invalidateCache } from "../redis/redisClient";
import logger from "../config/logger";

class UserService {
  private dbService = new DbService<UserDocument>(User);
  private CACHE_EXPIRATION = 3600; // 1 hour

  // Generic cache key methods
  private getUserKey(userId: string): string {
    return `user:${userId}`;
  }

  private getUserByEmailKey(email: string): string {
    return `user:email:${email}`;
  }

  private getAllUsersKey(filter: string = ""): string {
    return `users:all:${filter}`;
  }

  // Get user by ID
  async getUserById(id: string) {
    const cacheKey = this.getUserKey(id);

    // Try fetching from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.debug(`Cache hit for user data`);
      return JSON.parse(cachedData);
    }

    logger.debug(`Cache miss for user data, fetching from DB`);

    const user = await this.dbService.findById(id);
    if (!user) return null;

    // Cache user data
    await redisClient.set(cacheKey, JSON.stringify(user), { EX: this.CACHE_EXPIRATION });
    logger.debug(`Cached user data`);

    return user;
  }

  // Get user by email
  async getUserByEmail(email: string, includePassword = false) {
    // Don't cache if we're including the password for security reasons
    if (includePassword) {
      const projection = "+password";
      return this.dbService.findOne({ email }, projection);
    }

    const cacheKey = this.getUserByEmailKey(email);

    // Try fetching from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.debug(`Cache hit for user by email`);
      return JSON.parse(cachedData);
    }

    logger.debug(`Cache miss for user by email, fetching from DB`);

    const user = await this.dbService.findOne({ email });
    if (!user) return null;

    // Cache user data
    await redisClient.set(cacheKey, JSON.stringify(user), { EX: this.CACHE_EXPIRATION });
    logger.debug(`Cached user by email data`);

    return user;
  }

  // Check if a user exists by email
  async checkUserExists(email: string) {
    const cacheKey = `user:exists:${email}`;

    // Try fetching from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData !== null) {
      logger.debug(`Cache hit for user exists check`);
      return cachedData === 'true';
    }

    logger.debug(`Cache miss for user exists check, checking DB`);

    const exists = await this.dbService.exists({ email });

    // Cache result
    await redisClient.set(cacheKey, exists ? 'true' : 'false', { EX: this.CACHE_EXPIRATION });
    logger.debug(`Cached user exists result`);

    return exists;
  }

  // Create a new user
  async createUser(userData: Partial<UserDocument>) {
    const user = await this.dbService.create(userData);

    // Invalidate relevant caches
    await invalidateCache(this.getAllUsersKey());
    if (userData.email) {
      await invalidateCache(this.getUserByEmailKey(userData.email));
    }
    logger.debug(`Created user. Relevant caches invalidated`);

    return user;
  }

  // Update a user by ID
  async updateUserById(id: string, updates: UpdateQuery<UserDocument>) {
    const user = await this.dbService.update(id, updates, { new: true });

    if (!user) return null;

    // Invalidate relevant caches
    await invalidateCache(this.getUserKey(id));
    if (user.email) {
      await invalidateCache(this.getUserByEmailKey(user.email));
    }
    await invalidateCache(this.getAllUsersKey());
    logger.debug(`Updated user. Relevant caches invalidated`);

    return user;
  }

  // Fetch all users with optional filters
  async getAllUsers(filter: FilterQuery<UserDocument> = {}) {
    // Create a filter key for caching based on the filter object
    const filterKey = Object.keys(filter).length > 0
        ? Buffer.from(JSON.stringify(filter)).toString('base64')
        : "";

    const cacheKey = this.getAllUsersKey(filterKey);

    // Try fetching from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.debug(`Cache hit for all users`);
      return JSON.parse(cachedData);
    }

    logger.debug(`Cache miss for all users, fetching from DB`);

    const users = await this.dbService.findAll(filter);

    // Cache users data (shorter expiration for list of all users)
    await redisClient.set(cacheKey, JSON.stringify(users), { EX: 1800 }); // 30 minutes
    logger.debug(`Cached all users data`);

    return users;
  }

  // Delete a user by ID
  async deleteUserById(id: string) {
    // Get user first to have the email for cache invalidation
    const user = await this.dbService.findById(id);
    if (!user) return null;

    const deleted = await this.dbService.delete(id);
    if (!deleted) return null;

    // Invalidate relevant caches
    await invalidateCache(this.getUserKey(id));
    if (user.email) {
      await invalidateCache(this.getUserByEmailKey(user.email));
    }
    await invalidateCache(this.getAllUsersKey());
    logger.debug(`Deleted user. Relevant caches invalidated`);

    return deleted;
  }
}

export default new UserService();