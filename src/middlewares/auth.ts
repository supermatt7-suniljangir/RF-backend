import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/configURLs";
import { JwtPayload } from "../types/jwt-payload";
import { AppError } from "./error";
import { logoutUser } from "../controllers/user.controller";
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
  } catch (error) {
    // Invalid token, clear it but still continue
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
    throw new Error("Unauthorized - No token provided");
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    if (!decoded) {
      next(new AppError("invalid jwt", 401));
    }
    req.user = decoded;
    next();
  } catch (error: any) {
    next(new AppError(error.message, 401));
  }
};

// Role Checking Middleware
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      throw new Error("Authentication required or no role provided");
    }

    if (!roles.includes(req.user.role)) {
      throw new Error("Forbidden - Insufficient permissions");
    }
    next();
  };
};
