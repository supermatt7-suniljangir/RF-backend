import { RequestHandler, Router } from "express";
import FollowController from "../controllers/follow.controller";
import { limiters } from "../utils/rateLimiters";
import { auth, optionalAuth } from "../middlewares/auth";

const router = Router();

// Follow or unfollow a user
router.put(
  "/:userId/toggle",
  limiters.dev,
  auth,
  FollowController.toggleFollowUser,
);

// Fetch followers of a user
router.get(
  "/:userId/followers",
  limiters.dev,
  optionalAuth,
  FollowController.fetchFollowers,
);

// Fetch users followed by a user
router.get(
  "/:userId/following",
  limiters.dev,
  optionalAuth,
  FollowController.fetchFollowing,
);

// Check if the authenticated user follows a specific user
router.get(
  "/:userId/check",
  limiters.dev,
  auth,
  FollowController.isFollowingUser,
);

export default router;
