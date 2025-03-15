import {Types} from "mongoose";
import DbService from "./";
import Follow from "../models/others/follow.model";
import User from "../models/user/user.model";
import {IFollow} from "../types/others";
import {redisClient, invalidateCache} from "../redis/redisClient";
import logger from "../config/logger";

class FollowService {
    private dbService = new DbService<IFollow>(Follow);
    private CACHE_EXPIRATION = 3600; // 1 hour

    // Cache key generation methods
    private getFollowersKey(userId: string): string {
        return `followers:${userId}`;
    }

    private getFollowingKey(userId: string): string {
        return `following:${userId}`;
    }

    private getIsFollowingKey(followerId: string, userId: string): string {
        return `following:${followerId}:${userId}`;
    }

    // Toggle follow/unfollow a user
    async toggleFollow(followerId: string, userId: string) {
        if (userId === followerId) {
            throw new Error("You cannot follow yourself");
        }

        const followedUser = await User.findById(
            userId,
            "fullName profile.avatar followersCount"
        );
        const followerUser = await User.findById(
            followerId,
            "fullName profile.avatar followingCount"
        );

        if (!followedUser || !followerUser) {
            throw new Error("User not found");
        }

        const existingFollow = await this.dbService.findOne({
            "follower.userId": followerId,
            "following.userId": userId,
        });

        if (existingFollow) {
            await this.dbService.delete(existingFollow._id);
            followedUser.followersCount = Math.max(
                0,
                followedUser.followersCount - 1
            );
            followerUser.followingCount = Math.max(
                0,
                followerUser.followingCount - 1
            );

            await Promise.all([followedUser.save(), followerUser.save()]);

            // Invalidate cache since data changed
            await this.invalidateFollowCache(followerId, userId);

            return {followed: false};
        }

        await this.dbService.create({
            follower: {
                userId: followerId,
                fullName: followerUser.fullName,
                avatar: followerUser.profile?.avatar,
            },
            following: {
                userId,
                fullName: followedUser.fullName,
                avatar: followedUser.profile?.avatar,
            },
        });

        followedUser.followersCount += 1;
        followerUser.followingCount += 1;
        await Promise.all([followedUser.save(), followerUser.save()]);

        // Invalidate cache since data changed
        await this.invalidateFollowCache(followerId, userId);

        return {followed: true};
    }

    // Fetch followers of a user
    async getFollowers(userId: string) {
        const cacheKey = this.getFollowersKey(userId);

        // Try fetching from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }


        // Cache miss → Fetch from DB
        const followers = await Follow.find({"following.userId": userId})
            .select("follower followedAt")
            .lean();

        // Store in cache
        await redisClient.set(cacheKey, JSON.stringify(followers), {
            EX: this.CACHE_EXPIRATION,
        });


        return followers;
    }

    // Fetch users a user is following
    async getFollowing(userId: string) {
        const cacheKey = this.getFollowingKey(userId);

        // Try fetching from cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }


        // Cache miss → Fetch from DB
        const following = await Follow.find({"follower.userId": userId})
            .select("following followedAt")
            .lean();

        // Store in cache
        await redisClient.set(cacheKey, JSON.stringify(following), {
            EX: this.CACHE_EXPIRATION,
        });


        return following;
    }

    // Check if a user is following another user
    async isFollowing(followerId: string, userId: string) {
        const cacheKey = this.getIsFollowingKey(followerId, userId);

        // Try fetching from cache
        const cachedValue = await redisClient.get(cacheKey);
        if (cachedValue !== null) {
            return cachedValue === "true";
        }


        const exists = await this.dbService.exists({
            "follower.userId": followerId,
            "following.userId": userId,
        });
        const isFollowing = !!exists;

        // Store in cache
        await redisClient.set(cacheKey, isFollowing ? "true" : "false", {
            EX: this.CACHE_EXPIRATION,
        });


        return isFollowing;
    }

    // Invalidate all relevant caches when follow data changes
    private async invalidateFollowCache(followerId: string, userId: string) {
        // Invalidate followers cache for the user being followed
        await invalidateCache(this.getFollowersKey(userId));

        // Invalidate following cache for the follower
        await invalidateCache(this.getFollowingKey(followerId));

        // Invalidate the isFollowing status
        await invalidateCache(this.getIsFollowingKey(followerId, userId));
    }
}

export default new FollowService();