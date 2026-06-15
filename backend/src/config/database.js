import mongoose from "mongoose";
import logger from "../lib/logger.js";
import config from "./env.js";

const connectDB = async () => {
  try {
    // H9 FIX: Removed redundant MONGODB_URI check — already validated by
    // validateEnv() at startup. Uses centralized config instead of process.env.
    const conn = await mongoose.connect(config.MONGODB_URI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
