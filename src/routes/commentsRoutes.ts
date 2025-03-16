import express, { RequestHandler } from "express";
import CommentController from "../controllers/comments.controller";
import { auth } from "../middlewares/auth";
import { limiters } from "../utils/rateLimiters";

const router = express.Router();

// Add a comment
router.post(
  "/:projectId",
  limiters.intense,
  auth,
  CommentController.addProjectComment,
);

// Get all comments for a project
router.get("/:projectId", limiters.standard, CommentController.getAllComments);

// Delete a comment
router.delete(
  "/:projectId/:commentId",
  limiters.intense,
  auth,
  CommentController.deleteComment,
);

export default router;
