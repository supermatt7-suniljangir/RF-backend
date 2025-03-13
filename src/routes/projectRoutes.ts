import {Router} from "express";
import {limiters} from "../utils/rateLimiters";
import ProjectController from "../controllers/project.controller";
import {auth, optionalAuth} from "../middlewares/auth";
import {validateProject} from "../validators/ProjectValidation";

const router = Router();

// Public routes with standard rate limiting
router.get("/", limiters.standard, ProjectController.getProjects);

// Specific project routes
router.get("/:id", limiters.standard, optionalAuth, ProjectController.getProjectById);

// Protected routes with more restrictive rate limiting
router.post("/", auth, validateProject, ProjectController.createProject);
router.put("/:id", limiters.intense, auth, validateProject, ProjectController.updateProject);

// User project routes with different rate limits
router.get("/:userId/user", limiters.standard, optionalAuth, ProjectController.getProjectsByUser);
router.delete("/:id", limiters.standard, auth, ProjectController.deleteProject);


export default router;
