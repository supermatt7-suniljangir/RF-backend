import { Router } from "express";
import { limiters } from "../utils/rateLimiters";
import SearchController from "../controllers/search.controller";

const router = Router();
// Public routes with standard rate limiting
router.get("/users", limiters.search, SearchController.searchUsers);
router.get("/projects", limiters.search, SearchController.searchProjects);

export default router;
