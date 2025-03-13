import {createClient} from "redis";
import logger from "../config/logger";


const redisClient = createClient({
    url: process.env.REDIS_SERVER_URL, // Replace with your Redis server URL
});

redisClient.on("error", err => {
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
    logger.debug(`Invalidating cache for ${key}`);
    await redisClient.del(key);
}

export {redisClient, invalidateCache};
