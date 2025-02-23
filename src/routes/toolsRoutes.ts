import express from "express";
import ToolsController from "../controllers/tools.controller";
import { auth } from "../middlewares/auth";
import { limiters } from "../utils/rateLimiters";

const router = express.Router();

// Add a comment
router.post("/", limiters.intense, auth, ToolsController.createTool);
// Get all comments for a project
router.get("/", limiters.standard, ToolsController.getAllTools);
// Delete a comment
router.delete("/:toolId", limiters.intense, auth, ToolsController.deleteTool);

export default router;
