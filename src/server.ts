import express, { NextFunction, Request, Response } from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
import compression from "compression";
import userRoutes from "./routes/userRoutes";
import uploadRoutes from "./routes/uploaderRoutes";
import searchRoutes from "./routes/serachRoutes";
import commentsRoutes from "./routes/commentsRoutes";
import likesRoutes from "./routes/likesRoutes";
import bookmarksRoutes from "./routes/bookmarksRoutes";
import toolsRoutes from "./routes/toolsRoutes";
import ProjectRoutes from "./routes/projectRoutes";
import { PORT } from "./config/configURLs";
import { connectDB, disconnectDB } from "./config/db";
import cookieParser from "cookie-parser";
import { globalErrorHandler, notFound } from "./middlewares/error";
import cors from "cors";
import helmet from "helmet";
import logger from "./logs/logger";
import expressWinston from "express-winston";

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
      process.env.NODE_ENV === "production"
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
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {} : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

app.use("/api/users", userRoutes);
app.use("/api/projects", ProjectRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/bookmarks", bookmarksRoutes);
app.use(notFound);
app.use(globalErrorHandler);

const initializeServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
      try {
        await new Promise((resolve) => {
          server.close(resolve);
        });
        console.log("Server closed");
        await disconnectDB();
        console.log("Graceful shutdown completed");
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
};

initializeServer();
