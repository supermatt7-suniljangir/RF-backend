import express, { RequestHandler } from "express";
import CommentController from "../controllers/comments.controller";
import { auth } from "../middlewares/auth";
import { limiters } from "../utils/rateLimiters";

const router = express.Router();

const commentController = new CommentController();

// Add a comment
router.post("/:projectId", limiters.intense, auth, commentController.addProjectComment);

// Get all comments for a project
router.get("/:projectId", limiters.standard, commentController.getAllComments);

// Delete a comment
router.delete("/:projectId/:commentId", limiters.intense, auth, commentController.deleteComment);

export default router;
