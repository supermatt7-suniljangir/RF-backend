import { RequestHandler, Router } from "express";
import BookmarkController from "../controllers/bookmark.controller";
import { auth, optionalAuth } from "../middlewares/auth";

const router = Router();
const bookmarkController = new BookmarkController();

router.put("/:projectId/toggle", auth, bookmarkController.toggleBookmark);
router.get("/", auth, bookmarkController.getUserBookmarks);
router.get(
  "/:projectId/check",
  optionalAuth,
  bookmarkController.hasUserBookmarkedProject
);

export default router;
