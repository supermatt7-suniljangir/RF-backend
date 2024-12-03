import express, { Request, Response } from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
import morgan from "morgan";
import userRoutes from "./routes/userRoutes";
import ProjectRoutes from "./routes/projectRoutes";
import { PORT } from "./config/configURLs";
import { connectDB, disconnectDB } from "./config/db";
import cookieParser from "cookie-parser";
import { errorHandler, notFound } from "./middlewares/error";
import cors from "cors";
import helmet from "helmet";

app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev")); // 'dev' is a predefined format for concise logging
app.use(
  cors({
    origin: "http://localhost:5173", // Your Next.js frontend URL
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
    exposedHeaders: ["set-cookie"], // Add this if you're setting cookies
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Add this if you're serving images/resources
  })
);

app.get("/", (_: Request, res: Response) => {
  res.json({ message: "Hello World!" });
});

app.use("/api/users", userRoutes);
app.use("/api/projects", ProjectRoutes);
app.use(errorHandler);

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
