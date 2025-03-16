import { Response } from "express";
import logger from "../config/logger";

export const clearCookie = (res: Response) => {
  logger.info("clearing cookie");
  res.clearCookie("auth_token", {
    httpOnly: true,
    // secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    // expires: new Date(0), // Set expiration to a past date
    path: "/", // Ensure it applies to the same path as when set
  });
};
