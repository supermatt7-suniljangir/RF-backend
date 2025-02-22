import { Router } from "express";
import { limiters } from "../utils/rateLimiters";
import ProjectController from "../controllers/project.controller";
import { auth, optionalAuth } from "../middlewares/auth";
import { validateProject } from "../validators/projectValidation";

const router = Router();

const projectController = new ProjectController();
// Public routes with standard rate limiting
router.get("/", limiters.standard, projectController.getProjects);

// Specific project routes
router.get("/:id", limiters.standard, optionalAuth, projectController.getProjectById);

// Protected routes with more restrictive rate limiting
router.post("/", auth, validateProject, projectController.createProject);
router.put("/:id", limiters.intense, auth, validateProject, projectController.updateProject);

// User project routes with different rate limits
router.get("/:userId/user", limiters.standard, optionalAuth, projectController.getProjectsByUser);

export default router;
