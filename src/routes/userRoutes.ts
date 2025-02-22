// src/routes/user.routes.ts
import { RequestHandler, Router } from "express";
import { limiters } from "../utils/rateLimiters";
import UserController from "../controllers/user.controller";
import { auth } from "../middlewares/auth";
import { validateUser } from "../validators/userValidation";
import { validateAuth } from "../validators/authValidation";

const router = Router();
const userController = new UserController();
router.post("/auth", limiters.auth, validateAuth, userController.authUser);
router.post("/register", limiters.auth, validateUser, userController.registerUser);
router.get("/profile", limiters.standard, auth, userController.getUserProfile);
router.put(
  "/profile",
  limiters.standard,
  auth,
  validateUser,
  userController.updateUserProfile
);
router.get("/:id", limiters.standard, userController.getUserById);
router.post("/logout", limiters.standard, userController.logoutUser);

export default router;
