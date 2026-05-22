/**
 * Redis Client Module (redisClient.ts)
 *
 * Handles the Redis connection and error logging.
 */
import Redis from "ioredis";
import logger from "../config/logger";

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error("Redis: max reconnection attempts reached, giving up");
      return null; // null = stop retrying
    }
    return Math.min(times * 500, 2000);
  },
});
export default redis;
