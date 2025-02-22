// the not found middleware
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import logger from "../logs/logger";
import { AppError } from "../utils/responseTypes";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = `Not Found - ${req.originalUrl}`;
  next(new AppError(error, 404));
};

export const globalErrorHandler: ErrorRequestHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;

  logger.error(`Error occurred at ${req.url}: ${err.message}`);

  res.status(err.statusCode).json({
    message: err.message,
    success: false,
  });
};
