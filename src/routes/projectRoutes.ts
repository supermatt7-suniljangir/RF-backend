import { Router } from "express";
import {
  checkProjectOwnership,
  createProject,
  getProjectById,
  searchProjects,
  updateProject,
} from "../controllers/project.controller";
import { auth } from "../middlewares/auth";
import { validateProject } from "../validators/ProjectValidation";

const router = Router();

// Login user
router.get("/:id", getProjectById);

// Register user with validation middleware
router.post("/project", auth, validateProject, createProject);

// Get user profile (protected route)
router.get("/search", searchProjects);

// Logout user (protected route)
router.put("/:id", auth, validateProject, updateProject);

export default router;
