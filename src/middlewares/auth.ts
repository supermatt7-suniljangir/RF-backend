import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/configURLs";
import { JwtPayload } from "../types/jwt-payload";
import logger from "../config/logger";
import { AppError } from "../utils/responseTypes";
// Optional auth middleware that sets req.user if token exists but doesn't block if no token
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies.auth_token;
  if (!token) {
    // No token, but that's okay - continue as unauthenticated
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    logger.error(`auth middleware - error verifying token ${error.message}`);
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    next();
  }
};
// Authentication Middleware
export const auth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.auth_token;
  if (!token) {
    res.status(403);
    next(new AppError("Authentication required", 403));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    if (!decoded) {
      return next(new AppError("invalid jwt", 401));
    }
    req.user = decoded;
    next();
  } catch (error: any) {
    logger.error(`auth middleware - error verifying token`, error.message);
    return next(new AppError(error.message, 401));
  }
};

// Role Checking Middleware
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("insufficient permissions, action denied", 403));
    }
    next();
  };
};
