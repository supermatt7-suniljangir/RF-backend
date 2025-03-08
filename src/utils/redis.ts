/**
 * Redis Client Module (redisClient.ts)
 *
 * Handles the Redis connection and error logging.
 */
import Redis from "ioredis";
import logger from "../config/logger";

// Initialize Redis client with basic error handling
const redis = new Redis();

// Handle Redis connection errors
redis.on("error", (err) => {
    logger.error(`Redis error: ${err}`);
});

export default redis;
