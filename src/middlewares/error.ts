// the not found middleware
import { Request, Response, NextFunction } from "express";
import logger from "../logs/logger";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found- : ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// utils/appError.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Set to true to differentiate between operational and programming errors
  }
}

export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default statusCode to 500 if not set
  err.statusCode = err.statusCode || 500;

  // Log the error for monitoring (optional)
  logger.error(`Error occurred at ${req.url}: ${err.message}`);

  // Send error rsponse
  res.status(err.statusCode).json({
    status: err.statusCode >= 400 && err.statusCode < 500 ? "fail" : "error",
    message: err.message,
    success: false,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }), // Include stack trace in dev mode
  });
};

// export const errorHandler = (
//   error: Error,
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // Log the error using the logger
//   logger.error(`Error occurred: ${error.message}`, {
//     stack: error.stack,
//     method: req.method,
//     url: req.url,
//   });

//   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(statusCode);
//   res.json({
//     message: error.message,
//     stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
//   });
// };
