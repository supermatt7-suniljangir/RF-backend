import { Response } from "express";
import { AppError } from "../middlewares/error";
import jwt from "jsonwebtoken";

const generateToken = (res: Response, _id: any): string => {
  try {
    // Generate the JWT token
    const token = jwt.sign({ _id }, process.env.JWT_SECRET as string, {
      expiresIn: "30d",
    });

    // Set the token as an HTTP-only cookie
    res.cookie("auth_token", token, {
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // Protection against CSRF
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      path: "/", // Cookie is available for all routes
    });

    return token; // Optionally return token if needed elsewhere
  } catch (error) {
    // If something goes wrong, throw an AppError
    throw new AppError("Error generating token or setting cookie", 500);
  }
};

export default generateToken;
