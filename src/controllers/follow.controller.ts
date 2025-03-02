import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";
import { AppError, success } from "../utils/responseTypes";
import FollowService from "../services/FollowService";

class FollowController {
  // Toggle follow/unfollow a user
  static async toggleFollowUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const followerId = req.user!._id;

      if (!userId || !followerId) {
        next(new AppError("Missing follower or followed ID", 400));
        return;
      }

      const { followed } = await FollowService.toggleFollow(followerId, userId);

      res.status(200).json(
        success({
          data: followed,
          message: followed
            ? "User followed successfully"
            : "User unfollowed successfully",
        })
      );
    } catch (error: any) {
      logger.error("Error toggling follow:", error);
      next(new AppError(error.message, 500));
    }
  }

  // Fetch followers of a user
  static async fetchFollowers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      const followers = await FollowService.getFollowers(userId);

      res.status(200).json(
        success({
          data: followers,
          message: "Followers fetched successfully",
        })
      );
    } catch (error: any) {
      logger.error("Error fetching followers:", error);
      next(new AppError(error.message, 500));
    }
  }

  // Fetch users a user is following
  static async fetchFollowing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      const following = await FollowService.getFollowing(userId);

      res.status(200).json(
        success({
          data: following,
          message: "Following fetched successfully",
        })
      );
    } catch (error: any) {
      logger.error("Error fetching following:", error);
      next(new AppError(error.message, 500));
    }
  }

  // Check if a user is following another user
  static async isFollowingUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const followerId = req.user!._id;

      const isFollowing = await FollowService.isFollowing(followerId, userId);

      res.status(200).json(
        success({
          data: isFollowing,
          message: isFollowing ? "User is following" : "User is not following",
        })
      );
    } catch (error: any) {
      logger.error("Error checking follow status:", error);
      next(new AppError(error.message, 500));
    }
  }
}

export default FollowController;
