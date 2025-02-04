import express from "express";
import {
  getUserBookmarks,
  toggleBookmark,
  hasUserBookmarkedProject
} from "../controllers/bookmark.controller";
import { auth, optionalAuth } from "../middlewares/auth";
import { limiters } from "../utils/rateLimiters";

const router = express.Router();

// Add a comment
router.put("/toggle/:projectId", limiters.intense, auth, toggleBookmark);

// Get all bookmarks for a user
router.get("/", limiters.standard, auth, getUserBookmarks);
router.get("/check/:projectId", limiters.dev, optionalAuth, hasUserBookmarkedProject);

export default router;
