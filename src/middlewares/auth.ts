import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/configURLs";
import { JwtPayload } from "../jwt-payload";

// Authentication Middleware
export const auth = (req: Request, res: Response, next: NextFunction): void => {
  // Get token from HTTP-only cookie instead of Authorization header
  const token = req.cookies.auth_token;

  if (!token) {
    res.status(403);
    throw new Error("Unauthorized - No token provided");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    if (!decoded) {
      res.status(401);
      throw new Error("Unauthorized - Invalid token");
    }
    req.user = decoded;
    next();
  } catch (error: any) {
    // Clear invalid cookie
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    res.status(401);
    throw new Error(error.message);
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
