import winston from "winston";
import { NODE_ENV } from "./configURLs";

// Base log format for console transport
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
        const splat = rest[Symbol.for("splat")];
        const secondArg = Array.isArray(splat)
            ? JSON.stringify(splat[0], null, 2)
            : "";

        return `${timestamp} ${level}: ${message}${secondArg ? " " + secondArg : ""}`;
    })
);

const logger = winston.createLogger({
    level: "error", // Only log errors
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.colorize({ all: true }),
                winston.format.printf(({ timestamp, level, message, ...rest }) => {
                    const splat = rest[Symbol.for("splat")];
                    const secondArg = Array.isArray(splat)
                        ? JSON.stringify(splat[0], null, 2)
                        : "";

                    return `${timestamp} ${level}: ${message}${secondArg ? " " + secondArg : ""}`;
                })
            ),
        }),

        // File transports (commented out)
        /*
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          format: logFormat,
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          format: logFormat,
        }),
        */
    ],
});

export default logger;
