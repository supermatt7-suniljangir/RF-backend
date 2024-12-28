import express from "express";
import {
  addProjectComment,
  deleteComment,
  getAllComments,
} from "../controllers/comments.controller";
import { auth } from "../middlewares/auth";
import { limiters } from "../utils/rateLimiters";

const router = express.Router();

// Add a comment
router.post("/:projectId", limiters.intense, auth, addProjectComment);

// Get all comments for a project
router.get("/:projectId", limiters.intense, getAllComments);

// Delete a comment
router.delete("/:projectId/:commentId", limiters.intense, auth, deleteComment);

export default router;
