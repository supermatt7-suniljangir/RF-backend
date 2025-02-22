import { RequestHandler, Router } from "express";
import LikesController from "../controllers/likes.controller";
import { limiters } from "../utils/rateLimiters";
import { auth, optionalAuth } from "../middlewares/auth";

const router = Router();
const likesController = new LikesController();
router.put("/:projectId/toggle", limiters.dev, auth, likesController.toggleLikeProject);
router.get("/:projectId", limiters.dev, likesController.fetchProjectLikes);
router.get(
  "/:projectId/check",
  limiters.dev,
  optionalAuth,
  likesController.hasUserLikedProject
);
router.get(
  "/:userId/user",
  limiters.dev,
  optionalAuth,
  likesController.fetchProjectsLikedByUser
);

export default router;
