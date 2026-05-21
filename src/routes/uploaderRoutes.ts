// src/routes/upload.routes.ts
import { Router } from "express";
import { limiters } from "../utils/rateLimiters";
import UploadController from "../controllers/upload.controller";
import { auth, optionalAuth } from "../middlewares/auth";

const router = Router();
// router.use(auth);

// Upload Routes
router.post("/files", limiters.standard, UploadController.generateUploadUrls);
router.delete(
  "/files",
  limiters.standard,
  UploadController.deleteUploadedFiles,
);

export default router;
