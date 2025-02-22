import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import logger from "../logs/logger";
import { AppError, formValidationError } from "../utils/responseTypes";

// Login Schema
const LoginSchema = z
  .object({
    email: z.string().email("Please provide a valid email address").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .optional(),
    googleToken: z.string().optional(),
  })
  .refine((data) => (data.email && data.password) || data.googleToken, {
    message: "Either email and password or a valid Google token is required.",
  });

// Middleware for Login Validation
export const validateAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    await LoginSchema.parseAsync(req.body);
    next();
  } catch (error) {
    logger.error(error);
    if (error instanceof ZodError) {
      const validationErrors = error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json(formValidationError(validationErrors));
    }
    return next(new AppError("Validation error", 500));
  }
};
