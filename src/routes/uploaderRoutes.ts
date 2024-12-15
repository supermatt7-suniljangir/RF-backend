// src/routes/upload.routes.ts
import { Router } from "express";
import { limiters } from "../utils/rateLimiters";
import { generateUploadUrl } from "../controllers/upload.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.use(auth);

// Upload Routes
router.post("/file", limiters.standard, generateUploadUrl);

export default router;
