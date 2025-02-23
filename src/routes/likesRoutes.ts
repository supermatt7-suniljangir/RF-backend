import { RequestHandler, Router } from "express";
import LikesController from "../controllers/likes.controller";
import { limiters } from "../utils/rateLimiters";
import { auth, optionalAuth } from "../middlewares/auth";

const router = Router();
router.put("/:projectId/toggle", limiters.dev, auth, LikesController.toggleLikeProject);
router.get("/:projectId", limiters.dev, LikesController.fetchProjectLikes);
router.get(
  "/:projectId/check",
  limiters.dev,
  optionalAuth,
  LikesController.hasUserLikedProject
);
router.get(
  "/:userId/user",
  limiters.dev,
  optionalAuth,
  LikesController.fetchProjectsLikedByUser
);

export default router;
