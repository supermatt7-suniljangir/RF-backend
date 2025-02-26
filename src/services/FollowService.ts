import { Types } from "mongoose";
import DbService from "./";
import Follow from "../models/others/follow.model";
import User from "../models/user/user.model";
import { IFollow } from "../types/others";

class FollowService {
  private dbService = new DbService<IFollow>(Follow);

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
      return { followed: false };
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

    return { followed: true };
  }

  // Fetch followers of a user
  async getFollowers(userId: string) {
    return Follow.find({ "following.userId": userId })
      .select("follower followedAt")
      .lean();
  }

  // Fetch users a user is following
  async getFollowing(userId: string) {
    return Follow.find({ "follower.userId": userId })
      .select("following followedAt")
      .lean();
  }

  // Check if a user is following another user
  async isFollowing(followerId: string, userId: string) {
    const exists = await this.dbService.exists({
      "follower.userId": followerId,
      "following.userId": userId,
    });
    return !!exists;
  }
}

export default new FollowService();
