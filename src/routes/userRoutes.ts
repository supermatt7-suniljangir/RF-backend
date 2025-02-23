// src/routes/user.routes.ts
import { RequestHandler, Router } from "express";
import { limiters } from "../utils/rateLimiters";
import UserController from "../controllers/user.controller";
import { auth } from "../middlewares/auth";
import { validateUser } from "../validators/userValidation";
import { validateAuth } from "../validators/authValidation";

const router = Router();
router.post("/auth", limiters.auth, validateAuth, UserController.authUser);
router.post("/register", limiters.auth, validateUser, UserController.registerUser);
router.get("/profile", limiters.standard, auth, UserController.getUserProfile);
router.put(
  "/profile",
  limiters.standard,
  auth,
  validateUser,
  UserController.updateUserProfile
);
router.get("/:id", limiters.standard, UserController.getUserById);
router.post("/logout", limiters.standard, UserController.logoutUser);

export default router;
