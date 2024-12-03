import {  Router } from "express";
import {
  authUser,
  getUserProfile,
  registerUser,
  logoutUser
  
} from "../controllers/user.controller";
import { auth } from "../middlewares/auth";
import { validateUser } from "../validators/userValidation";

const router = Router();
router.post("/auth", authUser);
router.post("/register",validateUser, registerUser);
router.get("/", auth, getUserProfile);
router.post("/logout",auth, logoutUser);


export default router;
