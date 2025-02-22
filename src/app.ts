// app.ts
import express, { NextFunction, Request, Response } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import expressWinston from "express-winston";
import dotenv from "dotenv";
dotenv.config();
import logger from "./logs/logger";
import routerV1 from "./routes/RouterV1";
import { globalErrorHandler, notFound } from "./middlewares/error";
import { STAGES } from "./utils/stages";
import { auth } from "./middlewares/auth";
import UserController from "./controllers/user.controller";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(compression());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalUrl = req.originalUrl;

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${originalUrl} → ${res.statusCode} (${duration}ms)`,
      {
        method: req.method,
        url: originalUrl,
        statusCode: res.statusCode,
        duration,
      }
    );
  });
  next();
});

// Centralized error logging middleware
app.use(
  expressWinston.errorLogger({
    winstonInstance: logger,
    meta: true,
  })
);

// Enhanced CORS with more strict configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === STAGES.PROD
        ? ["https://yourdomain.com", "https://www.yourdomain.com"]
        : "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "X-CSRF-Token",
      "X-Requested-With",
      "Accept",
      "Accept-Version",
      "Content-Length",
      "Content-MD5",
      "Content-Type",
      "Date",
      "X-Api-Version",
    ],
    exposedHeaders: ["set-cookie"],
    maxAge: 86400,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === STAGES.PROD ? {} : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);
// app.use("/api/users/profile", auth, UserController.getUserProfile)
app.use("/api", routerV1);
app.use(notFound);
app.use(globalErrorHandler);

export default app;
