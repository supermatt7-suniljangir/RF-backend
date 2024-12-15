import { Router } from "express";
import { limiters } from "../utils/rateLimiters";
import { searchUsers, searchProjects } from "../controllers/search.controller";

const router = Router();
// Public routes with standard rate limiting
router.get("/users", limiters.search, searchUsers);
router.get("/projects", limiters.search, searchProjects);

export default router;
