import express from "express";
import ToolsController from "../controllers/tools.controller";
import { auth } from "../middlewares/auth";
import { limiters } from "../utils/rateLimiters";

const toolsController = new ToolsController();
const router = express.Router();

// Add a comment
router.post("/", limiters.intense, auth, toolsController.createTool);
// Get all comments for a project
router.get("/", limiters.standard, toolsController.getAllTools);
// Delete a comment
router.delete("/:toolId", limiters.intense, auth, toolsController.deleteTool);

export default router;
