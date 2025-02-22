import { RequestHandler, Router } from "express";
import FollowController from "../controllers/follow.controller";
import { limiters } from "../utils/rateLimiters";
import { auth, optionalAuth } from "../middlewares/auth";

const router = Router();
const followController = new FollowController();

// Follow or unfollow a user
router.put("/:userId/toggle", limiters.dev, auth, followController.toggleFollowUser);

// Fetch followers of a user
router.get("/:userId/followers", limiters.dev, optionalAuth, followController.fetchFollowers);

// Fetch users followed by a user
router.get("/:userId/following", limiters.dev, optionalAuth, followController.fetchFollowing);

// Check if the authenticated user follows a specific user
router.get("/:userId/check", limiters.dev, auth, followController.isFollowingUser);

export default router;
