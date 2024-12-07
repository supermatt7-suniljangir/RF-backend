// the not found middleware
import { Request, Response, NextFunction } from "express";
import logger from "../logs/logger";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found- : ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error using the logger
  logger.error(`Error occurred: ${error.message}`, {
    stack: error.stack,
    method: req.method,
    url: req.url,
  });

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
  });
};
