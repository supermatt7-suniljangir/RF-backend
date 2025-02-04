import express from "express";
import {
  toggleLikeProject,
  fetchProjectLikes,
  hasUserLikedProject,
} from "../controllers/likes.controller";
import { limiters } from "../utils/rateLimiters";
import { auth, optionalAuth } from "../middlewares/auth";

const router = express.Router();

router.put("/toggle/:projectId", limiters.dev, auth, toggleLikeProject);
router.get("/:projectId", limiters.dev, fetchProjectLikes);
router.get("/check/:projectId", limiters.dev, optionalAuth, hasUserLikedProject);

export default router;
