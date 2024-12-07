// src/routes/user.routes.ts
import { Router } from "express";
import { limiters } from "../utils/rateLimiters";
import {
  authUser,
  getUserProfile,
  registerUser,
  logoutUser,
  getUserById,
  updateUserProfile,
} from "../controllers/user.controller";
import { auth } from "../middlewares/auth";
import { validateUser } from "../validators/userValidation";

const router = Router();

router.post("/auth", limiters.auth, authUser);
router.post("/register", limiters.auth, validateUser, registerUser);
router.get("/", limiters.standard, auth, getUserProfile);
router.put("/", limiters.standard, auth, validateUser, updateUserProfile);
router.get("/:id", limiters.standard, getUserById);
router.post("/logout", limiters.standard, auth, logoutUser);

export default router;
