// src/routes/upload.routes.ts
import { Router } from "express";
import { limiters } from "../utils/rateLimiters";
import UploadController from "../controllers/upload.controller";
import { auth } from "../middlewares/auth";

const router = Router();
const uploadController = new UploadController();
router.use(auth);

// Upload Routes
router.post("/files", limiters.standard, uploadController.generateUploadUrls);

export default router;
