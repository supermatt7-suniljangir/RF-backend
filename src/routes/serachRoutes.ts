import { Router } from "express";
import { limiters } from "../utils/rateLimiters";
import SearchController from "../controllers/search.controller";

const searchController = new SearchController();
const router = Router();
// Public routes with standard rate limiting
router.get("/users", limiters.search, searchController.searchUsers);
router.get("/projects", limiters.search, searchController.searchProjects);

export default router;
