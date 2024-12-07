import { Router } from "express";
import {
  checkProjectOwnership,
  createProject,
  getProjectById,
  getProjects,
  getProjectsByUser,
  searchProjects,
  updateProject,
} from "../controllers/project.controller";
import { auth, optionalAuth } from "../middlewares/auth";
import { validateProject } from "../validators/ProjectValidation";

const router = Router();

router.get("/", getProjects);
router.get("/search", searchProjects);

// Specific project routes
router.get("/:id", optionalAuth, getProjectById);

// Project creation and update 
router.post("/project", auth, validateProject, createProject);
router.put("/:id", auth, validateProject, updateProject);

// User project routes
router.get("/user/personal", auth, getProjectsByUser);
router.get("/user/:userId", optionalAuth, getProjectsByUser);

export default router;