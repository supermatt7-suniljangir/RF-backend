// src/utils/rateLimiter.ts
import rateLimit from "express-rate-limit";
import { RateLimitRequestHandler } from "express-rate-limit";

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // default 15 minutes
  max = 100, // default 100 requests
  message = "Too many requests, please try again later",
}: RateLimitOptions = {}): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Predefined rate limit configurations
export const limiters = {
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: "Too many login attempts, please try again later",
  }),

  standard: createRateLimiter(), // default 100 requests per hour

  intense: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // more restrictive
    message: "Hourly request limit exceeded",
  }),
};
