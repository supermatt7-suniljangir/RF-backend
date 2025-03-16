import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError, formValidationError } from "../utils/responseTypes";
// Social Schema
const SocialSchema = z.object({
  facebook: z.string().url("Invalid Facebook URL").optional(),
  twitter: z.string().url("Invalid Twitter URL").optional(),
  instagram: z.string().url("Invalid Instagram URL").optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional(),
  github: z.string().url("Invalid GitHub URL").optional(),
});

const ProfileSchema = z.object({
  bio: z.string().max(300, "Bio cannot exceed 300 characters").optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  cover: z.string().url("Invalid cover URL").optional(),
  followers: z.array(z.string()).optional(), // Array of user IDs
  following: z.array(z.string()).optional(), // Array of user IDs
  website: z.string().url("Invalid website URL").optional(),
  profession: z.string().optional(),
  availableForHire: z.boolean().optional(),
  social: SocialSchema.optional(),
});

// User Schema
const UserSchema = z.object({
  token: z.string().optional(),
  expiresIn: z.number().int().nonnegative().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .nonempty("Email is required"),
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(50, "Full name cannot exceed 50 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password cannot exceed 128 characters")
    .optional(),
  profile: ProfileSchema.optional(),
});

// Validation Middleware for Create/Update
export const validateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    // If it's an update (PATCH request), make all fields optional
    const schema = req.method === "PUT" ? UserSchema.partial() : UserSchema;

    await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json(formValidationError(validationErrors));
    }
    return next(new AppError("Validation error", 500));
  }
};
