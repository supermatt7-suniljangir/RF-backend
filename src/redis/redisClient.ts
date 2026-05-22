import { createClient } from "redis";
import logger from "../config/logger";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      console.log("Redis retries:", retries);

      if (retries > 3) {
        console.log("Stopping Redis reconnect attempts");
        return false;
      }

      return 1000;
    },
  },
});

redisClient.on("error", (err) => {
  logger.error("Redis error:", err);
});

(async () => {
  try {
    await redisClient.connect();
    logger.info("Redis client connected successfully");
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
  }
})();

const invalidateCache = async (key: string) => {
  await redisClient.del(key);
};

export { redisClient, invalidateCache };
