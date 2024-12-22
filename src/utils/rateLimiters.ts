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
  max = 10000, // default 100 requests
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
    windowMs: 0 * 60 * 1000, // 15 minutes
    max: 50, // 5 attempts
    message: "Too many login attempts, please try again later",
  }),

  standard: createRateLimiter(), 

  intense: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // more restrictive
    message: "Hourly request limit exceeded",
  }),
  search: createRateLimiter({
    windowMs: 10 * 60 * 1000, // 15 minutes window
    max: 100, // 100 searches per 15 minutes
    message: "Too many search requests, please refine your search or try again later",
  }),

  // More intensive search limiter for complex or resource-heavy searches
  advancedSearch: createRateLimiter({
    windowMs: 30 * 60 * 1000, // 30 minutes window
    max: 50, // 50 advanced searches per 30 minutes
    message: "Advanced search limit reached. Please wait before performing more complex searches.",
  }),
};
