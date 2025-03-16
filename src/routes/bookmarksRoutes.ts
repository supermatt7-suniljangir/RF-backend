import { RequestHandler, Router } from "express";
import BookmarkController from "../controllers/bookmark.controller";
import { auth, optionalAuth } from "../middlewares/auth";

const router = Router();

router.put("/:projectId/toggle", auth, BookmarkController.toggleBookmark);
router.get("/", auth, BookmarkController.getUserBookmarks);
router.get(
  "/:projectId/check",
  optionalAuth,
  BookmarkController.hasUserBookmarkedProject,
);

export default router;
