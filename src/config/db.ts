import mongoose from "mongoose";
import { MONGO_URI } from "./configURLs";
import logger from "../logs/logger";
import { AppError } from "../middlewares/error";
const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      logger.error("Invalid mongo uri");
      throw new AppError("invalid mongo uri", 500);
    }
    const conn = await mongoose.connect(MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`Error: ${err as Error}`);
    process.exit(1);
  }
};
// disconect db
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB Disconnected");
  } catch (err) {
    logger.error(`Error: ${err as Error}`);
    process.exit(1);
  }
};

export { connectDB, disconnectDB };
