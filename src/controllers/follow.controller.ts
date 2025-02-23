import { Request, Response, NextFunction } from "express";
import Follow from "../models/others/follow.model";
import User from "../models/user/user.model";
import logger from "../logs/logger";
import { AppError, success } from "../utils/responseTypes";

class FollowController {
  static async toggleFollowUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const followerId = req.user!._id;
      if (!userId || !followerId) {
        next(new AppError("missing follower or followed id", 400));
        return;
      }
      if (userId === followerId.toString()) {
        next(new AppError("You cannot follow yourself", 400));
        return;
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
        logger.error(`User not found: ${userId} or ${followerId}`);
        next(new AppError("User not found", 404));
        return;
      }

      const existingFollow = await Follow.findOne({
        "follower.userId": followerId,
        "following.userId": userId,
      });

      if (existingFollow) {
        await existingFollow.deleteOne();
        followedUser.followersCount = Math.max(
          0,
          followedUser.followersCount - 1
        );
        followerUser.followingCount = Math.max(
          0,
          followerUser.followingCount - 1
        );
        await Promise.all([followedUser.save(), followerUser.save()]);
        res
          .status(200)
          .json(
            success({ data: false, message: "User unfollowed successfully" })
          );
        return;
      }

      await Follow.create({
        follower: {
          userId: followerId,
          fullName: followerUser.fullName,
          avatar: followerUser.profile?.avatar || null,
        },
        following: {
          userId,
          fullName: followedUser.fullName,
          avatar: followedUser.profile?.avatar || null,
        },
      });

      followedUser.followersCount += 1;
      followerUser.followingCount += 1;
      await Promise.all([followedUser.save(), followerUser.save()]);

      res
        .status(200)
        .json(success({ data: true, message: "User followed successfully" }));
    } catch (error) {
      logger.error("Error toggling follow:", error);
      next(new AppError("Error toggling follow", 500));
    }
  }

  static async fetchFollowers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      const followers = await Follow.find({ "following.userId": userId })
        .select("follower followedAt")
        .lean()
        .exec();

      res.status(200).json(
        success({
          data: followers,
          message: "Followers fetched successfully",
        })
      );
    } catch (error) {
      logger.error("Error fetching followers:", error);
      next(new AppError("Error fetching followers", 500));
    }
  }

  static async fetchFollowing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      const following = await Follow.find({ "follower.userId": userId })
        .select("following followedAt")
        .lean()
        .exec();

      res.status(200).json(
        success({
          data: following,
          message: "Following fetched successfully",
        })
      );
    } catch (error) {
      logger.error("Error fetching following:", error);

      next(new AppError("Error fetching following", 500));
    }
  }

  static async isFollowingUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const followerId = req.user!._id;

      const exists = await Follow.exists({
        "follower.userId": followerId,
        "following.userId": userId,
      });

      res.status(200).json(
        success({
          data: !!exists,
          message: exists ? "User is following" : "User is not following",
        })
      );
    } catch (error) {
      logger.error("Error checking follow status:", error);
      next(new AppError("Error checking follow status", 500));
    }
  }
}

export default FollowController;
