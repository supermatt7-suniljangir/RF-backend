/**
 * CORS Configuration Utility (corsConfig.ts)
 *
 * This module provides a reusable CORS configuration object for both Express and Socket.IO.
 */

import {STAGES} from "../utils/stages";


/**
 * getCorsConfig Function
 *
 * Returns the appropriate CORS configuration based on the environment.
 *
 * @returns {Object} - CORS configuration object.
 */
export const getCorsConfig = () => {
    const isProduction = process.env.NODE_ENV === STAGES.PROD;

    return {
        origin: isProduction
            ? ["https://yourdomain.com", "https://www.yourdomain.com"] // Production domains
            : ["http://localhost:5173"], // Development domain
        credentials: true, // Allow credentials (e.g., cookies)
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
        allowedHeaders: [
            "X-CSRF-Token",
            "X-Requested-With",
            "Accept",
            "Accept-Version",
            "Content-Length",
            "Content-MD5",
            "Content-Type",
            "Date",
            "X-Api-Version",
        ], // Allowed headers
        exposedHeaders: ["set-cookie"], // Exposed headers
        maxAge: 86400, // Preflight request cache duration (24 hours)
    };
};
