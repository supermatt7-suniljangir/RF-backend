import { Router } from "express";
import { limiters } from "../utils/rateLimiters";
import {
  createProject,
  getProjectById,
  getProjects,
  getProjectsByUser,
  updateProject,
} from "../controllers/project.controller";
import { auth, optionalAuth } from "../middlewares/auth";
import { validateProject } from "../validators/ProjectValidation";

const router = Router();

// Public routes with standard rate limiting
router.get("/", limiters.standard, getProjects);

// Specific project routes
router.get("/:id", limiters.standard, optionalAuth, getProjectById);

// Protected routes with more restrictive rate limiting
router.post("/", limiters.intense, auth, validateProject, createProject);
router.put("/:id", limiters.intense, auth, validateProject, updateProject);

// User project routes with different rate limits
router.get("/user/personal", limiters.standard, auth, getProjectsByUser);
router.get("/user/:userId", limiters.standard, optionalAuth, getProjectsByUser);

export default router;
