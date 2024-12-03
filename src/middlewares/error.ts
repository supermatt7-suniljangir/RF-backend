// the not found middleware
import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found- : ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// the error handler middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
console.error(error?.stack || error?.message);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === "prod" ? "🥞" : error.stack,
    });

}