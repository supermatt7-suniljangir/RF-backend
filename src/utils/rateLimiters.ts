// src/utils/rateLimiter.ts
import rateLimit from "express-rate-limit";
import { RateLimitRequestHandler } from "express-rate-limit";

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

// Generalized rate limiter factory
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // default 15 minutes
  max = 1000, // default 100 requests per window
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
  // For authentication routes to prevent brute force attacks
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 50, // Max 5 attempts per window
    message: "Too many login attempts, please try again later",
  }),

  // General usage for standard routes
  standard: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 1000, // Max 100 requests per window
    message: "Too many requests, please slow down",
  }),

  // For resource-intensive operations or sensitive routes
  intense: createRateLimiter({
    windowMs: 30 * 60 * 1000, // 30 minutes window
    max: 3000, // Max 30 requests per window
    message: "Request limit exceeded, please try again later",
  }),

  // For basic search functionality
  search: createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes window
    max: 500, // Max 50 search requests per window
    message:
      "Too many search requests, please refine your search or try again later",
  }),

  // For complex or resource-heavy searches
  advancedSearch: createRateLimiter({
    windowMs: 30 * 60 * 1000, // 30 minutes window
    max: 200, // Max 20 advanced searches per window
    message:
      "Advanced search limit reached. Please wait before performing more complex searches.",
  }),

  // For development and testing purposes
  dev: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 1000, // Higher limit for faster iteration during development
    message: "Too many requests, please try again later",
  }),
};
