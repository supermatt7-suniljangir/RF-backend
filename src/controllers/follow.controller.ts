import { Request, Response, NextFunction, RequestHandler } from "express";
import Follow from "../models/others/follow.model";
import User from "../models/user/user.model";
import logger from "../logs/logger";
import { AppError, success } from "../utils/responseTypes";
import asyncHandler from "../middlewares/asyncHanlder";

class FollowController {
  public toggleFollowUser = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      try {
        const { userId } = req.params;
        const followerId = req.user!._id;
        if (!userId || !followerId) {
          return next(new AppError("missing follower or followed id", 400));
        }
        if (userId === followerId.toString()) {
          return next(new AppError("You cannot follow yourself", 400));
        }

        // Fetch both users to access follower/following counts
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
          return next(new AppError("User not found", 404));
        }

        const existingFollow = await Follow.findOne({
          "follower.userId": followerId,
          "following.userId": userId,
        });

        if (existingFollow) {
          // Unfollow and decrement counts
          await existingFollow.deleteOne();

          followedUser.followersCount = Math.max(0, followedUser.followersCount - 1);
          followerUser.followingCount = Math.max(0, followerUser.followingCount - 1);
        
          await Promise.all([followedUser.save(), followerUser.save()]);
          return res
            .status(200)
            .json(
              success({ data: false, message: "User unfollowed successfully" })
            );
        } else {
          // Follow and increment counts
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

          await User.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } });
          await User.findByIdAndUpdate(followerId, {
            $inc: { followingCount: 1 },
          });

          return res
            .status(200)
            .json(
              success({ data: true, message: "User followed successfully" })
            );
        }
      } catch (error) {
        logger.error("Error toggling follow:", error);
        return next(new AppError("Error toggling follow", 500));
      }
    }
  ) as RequestHandler;

  // Fetch followers of a user
  public fetchFollowers = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      try {
        const { userId } = req.params;

        const followers = await Follow.find({ "following.userId": userId })
          .select("follower followedAt")
          .lean()
          .exec();

        return res.status(200).json(
          success({
            data: followers,
            message: "Followers fetched successfully",
          })
        );
      } catch (error) {
        logger.error("Error fetching followers:", error);
        return next(new AppError("Error fetching followers", 500));
      }
    }
  ) as RequestHandler;

  // Fetch users followed by a user
  public fetchFollowing = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      try {
        const { userId } = req.params;

        const following = await Follow.find({ "follower.userId": userId })
          .select("following followedAt")
          .lean()
          .exec();

        return res.status(200).json(
          success({
            data: following,
            message: "Following fetched successfully",
          })
        );
      } catch (error) {
        logger.error("Error fetching following:", error);
        return next(new AppError("Error fetching following", 500));
      }
    }
  ) as RequestHandler;

  // Check if the authenticated user follows a specific user
  public isFollowingUser = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      try {
        const { userId } = req.params;
        const followerId = req.user!._id;

        const exists = await Follow.exists({
          "follower.userId": followerId,
          "following.userId": userId,
        });

        return res.status(200).json(
          success({
            data: !!exists,
            message: exists ? "User is following" : "User is not following",
          })
        );
      } catch (error) {
        logger.error("Error checking follow status:", error);
        return next(new AppError("Error checking follow status", 500));
      }
    }
  ) as RequestHandler;
}

export default FollowController;
