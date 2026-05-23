import { Router } from "express";
import { limiters } from "../utils/rateLimiters";
import GoogleAuthController from "../controllers/googleAuth.controller";

const router = Router();
router.post("/auth", limiters.auth, GoogleAuthController.googleAuthHandler);
export default router;
