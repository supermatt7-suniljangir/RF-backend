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
  next: NextFunction,
): void => {
  const token = req.cookies.auth_token;
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    logger.error(
      `optionalAuth middleware - JWT Error: ${error.name} - ${error.message}`,
    );
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    next();
  }
};

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.auth_token;
  if (!token) {
    res.status(401);
    return next(new AppError("AUTH_REQUIRED", 401));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    logger.error(
      `auth middleware - JWT Error: ${error.name} - ${error.message}`,
    );

    let errorCode: string;
    let statusCode = 401;

    switch (error.name) {
      case "TokenExpiredError":
        errorCode = "TOKEN_EXPIRED";
        break;
      case "JsonWebTokenError":
        errorCode = "INVALID_TOKEN";
        break;
      case "NotBeforeError":
        errorCode = "TOKEN_NOT_ACTIVE";
        break;
      default:
        errorCode = "UNAUTHORIZED";
    }

    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(statusCode).json({
      success: false,
      data: null,
      message: errorCode, // Keep it simple; frontend will map it properly
    });
  }
};
