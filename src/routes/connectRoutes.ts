import ConnectController from "../controllers/connect.controller";
import { limiters } from "../utils/rateLimiters";
import { auth } from "../middlewares/auth";
import { Router } from "express";

const router: Router = Router();
router.get("/chat", limiters.dev, auth, ConnectController.getChatHistory);
router.get(
  "/conversations",
  limiters.dev,
  auth,
  ConnectController.getRecentConversations,
);

export default router;
