import winston from "winston";
import { NODE_ENV } from "./configURLs";
import fs from "fs";
import path from "path";

// Ensure logs directory exists
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Base log format for file transports
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, ...rest }) => {
    // Handle the second argument if present
    const splat = rest[Symbol.for('splat')];
    const secondArg = Array.isArray(splat) ? 
      JSON.stringify(splat[0], null, 2) : '';
    
    return `${timestamp} ${level}: ${message}${secondArg ? ' ' + secondArg : ''}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: NODE_ENV === "production" ? "info" : "debug",
  transports: [
    // Console transport with proper colorization
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        // First generate the log string
        winston.format.printf(({ timestamp, level, message, ...rest }) => {
          const splat = rest[Symbol.for('splat')];
          const secondArg = Array.isArray(splat) ? 
            JSON.stringify(splat[0], null, 2) : '';
          
          return `${timestamp} ${level}: ${message}${secondArg ? ' ' + secondArg : ''}`;
        }),
        // Then colorize the entire string
        winston.format.colorize({ all: true })
      )
    }),

    // File transports (use the standard logFormat)
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
  ],
});

export default logger;