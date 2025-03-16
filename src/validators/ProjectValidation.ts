import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import logger from "../config/logger";
import { AppError, formValidationError } from "../utils/responseTypes";

// Custom regex pattern for URLs
const URL_PATTERN = /^https?:\/\/.+/i;

// Helper function to validate MongoDB ObjectId
const isValidMongoId = (value: string) => isValidObjectId(value);

// Media Schema
const MediaSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url("Invalid media URL"),
  order: z.number().int().min(0).optional(),
});

// Copyright Schema
const CopyrightSchema = z.object({
  license: z.string().min(1, "License is required"),
  allowsDownload: z.boolean().default(false),
  commercialUse: z.boolean().default(false),
});

// Main Project Schema
const ProjectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  shortDescription: z.string().max(160),
  thumbnail: z.string().url("Invalid thumbnail URL"),
  media: z.array(MediaSchema).max(10),
  creator: z.string().refine(isValidMongoId, "Invalid creator ID"),
  collaborators: z
    .array(z.string().refine(isValidMongoId, "Invalid collaborator ID"))
    .optional(),
  tags: z.array(z.string()).max(10).optional(),
  tools: z
    .array(z.string().refine(isValidMongoId, "Invalid tool ID"))
    .optional(),
  category: z.string().min(1, "Category is required"),
  stats: z
    .object({
      views: z.number().int().default(0),
      likes: z.number().int().default(0),
      saves: z.number().int().default(0),
      comments: z.number().int().default(0),
    })
    .optional(),
  featured: z.boolean().default(false),
  publishedAt: z.preprocess((val) => new Date(val as number), z.date()),
  status: z.enum(["draft", "published"]).default("draft"),
  copyright: CopyrightSchema,
});

// Middleware for validation
export const validateProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    await ProjectSchema.parseAsync(req.body);
    next();
  } catch (error) {
    logger.error(error);
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
