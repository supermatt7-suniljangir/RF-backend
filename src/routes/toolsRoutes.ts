import express from "express";
import {
  createTool,
  getAllTools,
  deleteTool,
} from "../controllers/tools.controller";
import { auth } from "../middlewares/auth";
import { limiters } from "../utils/rateLimiters";

const router = express.Router();

// Add a comment
router.post("/", limiters.intense, auth, createTool);
// Get all comments for a project
router.get("/", limiters.standard, getAllTools);
// Delete a comment
router.delete("/:toolId", limiters.intense, auth, deleteTool);

export default router;
