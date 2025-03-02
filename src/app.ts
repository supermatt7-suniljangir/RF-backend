// app.ts
import express, { NextFunction, Request, Response } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import expressWinston from "express-winston";
import dotenv from "dotenv";
dotenv.config();
import logger from "./config/logger";
import routerV1 from "./routes/RouterV1";
import { globalErrorHandler, notFound } from "./middlewares/error";
import { STAGES } from "./utils/stages";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(compression());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Assuming this is part of an Express middleware
app.use((req, res, next) => {
  const originalUrl = req.originalUrl || req.url;
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logMessage = `${req.method} ${originalUrl} → ${statusCode} (${duration}ms)`;
    const logData = {
      method: req.method,
      url: originalUrl,
      statusCode: statusCode,
      duration,
    };

    // Use different log levels based on status code
    if (statusCode >= 500) {
      // Server errors
      logger.error(logMessage, logData);
    } else if (statusCode >= 400) {
      // Client errors
      logger.warn(logMessage, logData);
    } else {
      // Success responses
      logger.info(logMessage, logData);
    }
  });

  // This should be inside the middleware function
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
