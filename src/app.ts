/**
 * Express Application Setup
 *
 * This file configures the Express application, including middleware, routing, error handling,
 * and security settings. It is the entry point for the backend server and integrates various
 * utilities like logging, compression, CORS, and helmet for enhanced security.
 */

import express, {NextFunction, Request, Response} from "express"; // Core Express framework
import compression from "compression"; // Middleware to compress responses
import cookieParser from "cookie-parser"; // Middleware to parse cookies
import cors from "cors"; // Middleware to enable CORS
import helmet from "helmet"; // Middleware to set security-related HTTP headers
import expressWinston from "express-winston"; // Middleware for logging HTTP requests and errors
import dotenv from "dotenv"; // Environment variable configuration
dotenv.config(); // Load environment variables from .env file

import logger from "./config/logger"; // Custom logger for application logs
import routerV1 from "./routes/RouterV1"; // API routes (version 1)
import {globalErrorHandler, notFound} from "./middlewares/error"; // Error handling middlewares
import {STAGES} from "./utils/stages"; // Constants for environment stages (e.g., "production", "development")
import {getCorsConfig} from "./config/corsConfig";

// Initialize the Express application
const app = express();


/**
 * CORS Configuration
 *
 * This middleware enables Cross-Origin Resource Sharing (CORS) with strict settings:
 * - Origin: Allows requests from specific domains (production or development).
 * - Credentials: Allows cookies and authentication headers.
 * - Methods: Specifies allowed HTTP methods.
 * - Headers: Specifies allowed and exposed headers.
 * - Max Age: Caches preflight requests for 24 hours.
 */

app.use(cors(getCorsConfig()));
app.set("trust proxy", 1);

/**
 * Middleware Setup
 *
 * The following middleware functions are applied to the Express app in order:
 * 1. cookieParser: Parses cookies from incoming requests.
 * 2. express.json: Parses JSON payloads in request bodies.
 * 3. compression: Compresses HTTP responses for better performance.
 * 4. express.urlencoded: Parses URL-encoded request bodies.
 */
app.use(cookieParser());
app.use(express.json());
app.use(compression());
app.use(express.urlencoded({extended: true, limit: "10kb"}));

/**
 * Custom Request Logging Middleware
 *
 * This middleware logs details about incoming requests and outgoing responses, including:
 * - HTTP method
 * - Request URL
 * - Status code
 * - Response duration
 *
 * Logs are categorized by severity:
 * - Error (500+): Server errors
 * - Warn (400-499): Client errors
 * - Info (200-399): Successful responses
 */


app.use((req, res, next) => {
    const originalUrl = req.originalUrl || req.url; // Capture the request URL
    const start = Date.now(); // Start timing the request
    // Log response details when the request finishes
    res.on("finish", () => {
        console.log(`${cookies}${req.cookies}`);
        const duration = Date.now() - start; // Calculate response duration
        const statusCode = res.statusCode; // Capture the status code
        const logMessage = `${req.method}  ${originalUrl} → ${statusCode} (${duration}ms)`; // Create log message
        const logData = {
            method: req.method,
            url: originalUrl,
            statusCode: statusCode,
            duration,
        };

        // Log based on status code severity
        if (statusCode >= 500) {
            logger.error(logMessage, logData); // Server errors
        } else if (statusCode >= 400) {
            logger.warn(logMessage, logData); // Client errors
        } else {
            logger.info(logMessage, logData); // Successful responses
        }
    });

    next(); // Proceed to the next middleware
});

/**
 * Centralized Error Logging Middleware
 *
 * This middleware logs errors that occur during request processing.
 * It uses express-winston to capture detailed error information.
 */
app.use(
    expressWinston.errorLogger({
        winstonInstance: logger, // Use the custom logger
        meta: true, // Include metadata in logs
    })
);


/**
 * Helmet Configuration
 *
 * This middleware sets security-related HTTP headers using Helmet:
 * - Content Security Policy (CSP): Disabled in development for easier debugging.
 * - Cross-Origin Resource Policy: Allows cross-origin resource sharing.
 * - Referrer Policy: Controls the Referer header for privacy and security.
 */
app.use(
    helmet({
        contentSecurityPolicy: process.env.NODE_ENV === STAGES.PROD ? {} : false, // Disable CSP in development
        crossOriginResourcePolicy: {policy: "cross-origin"}, // Allow cross-origin resources
        referrerPolicy: {policy: "strict-origin-when-cross-origin"}, // Strict referrer policy
    })
);

/**
 * API Routing
 *
 * All API routes are prefixed with `/api` and handled by `routerV1`.
 * Example: `/api/users`, `/api/posts`, etc.
 */
app.use("/api", routerV1);

/**
 * Error Handling Middleware
 *
 * These middlewares handle cases where:
 * 1. A route is not found (404).
 * 2. An error occurs during request processing (global error handler).
 */
app.use(notFound); // Handle 404 errors
app.use(globalErrorHandler); // Handle all other errors

// Export the configured Express application
export default app;
