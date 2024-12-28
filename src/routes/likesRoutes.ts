import express from "express";
import {
  toggleLikeProject,
  fetchProjectLikes,
  hasUserLikedProject,
} from "../controllers/likes.controller";
import { limiters } from "../utils/rateLimiters";
import { auth, optionalAuth } from "../middlewares/auth";

const router = express.Router();

router.put("/toggle/:projectId", limiters.intense, auth, toggleLikeProject);
router.get("/:projectId", limiters.intense, fetchProjectLikes);
router.get("/check/:projectId", limiters.intense, optionalAuth, hasUserLikedProject);

export default router;
