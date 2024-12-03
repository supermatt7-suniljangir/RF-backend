import mongoose from "mongoose";
import { MONGO_URI } from "./configURLs";
const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      console.log("invalid mongo uri");
      throw new Error("Invalid mongo uri");
    }
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`Mongo db connected: `, conn.connection.host);
  } catch (err) {
    console.log(`Error: ${err as Error}`);
    process.exit(1);
  }
};
// disconect db
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("Mongo db disconnected");
  } catch (err) {
    console.log(`Error: ${err as Error}`);
    process.exit(1);
  }
};

export { connectDB, disconnectDB };
