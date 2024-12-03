import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { isValidObjectId } from "mongoose";

// Custom regex patterns
const URL_PATTERN = /^https?:\/\/.+/i;
const LICENSE_TYPES = [
  "MIT",
  "Apache-2.0",
  "GPL-3.0",
  "BSD-3-Clause",
  "Custom",
  "All Rights Reserved",
] as const;

// Helper function to validate MongoDB ObjectId
const isValidMongoId = (value: string) => isValidObjectId(value);

// Tool Schema
const ToolSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().optional(),
});

// Media Zod Schema
const MediaSchema = z.object({
  type: z.enum(["image", "mp4"]), // type can only be "image" or "mp4"
  url: z.string(), // URL is required and must be a string
});

// Thumbnail Schema
const ThumbnailSchema = z.object({
  url: z.string().url("Invalid thumbnail URL"),
  alt: z.string().max(100),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

// Copyright Schema
const CopyrightSchema = z.object({
  license: z.enum(LICENSE_TYPES),
  allowsDownload: z.boolean(),
  commercialUse: z.boolean(),
});

// Main Project Schema
const ProjectSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters")
    .refine((val) => !val.includes("@"), "Title cannot contain @ symbol"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),

  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(160, "Short description cannot exceed 160 characters"),

  thumbnail: ThumbnailSchema,

  media: z.array(MediaSchema).max(10, "Maximum 10 media items allowed"),

  creator: z.string().refine(isValidMongoId, "Invalid creator ID"),

  collaborators: z
    .array(z.string().refine(isValidMongoId, "Invalid collaborator ID"))
    .optional(),

  tags: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .max(10, "Maximum 10 tags allowed"),

  tools: z
    .array(ToolSchema)
    .min(1, "At least one tool is required")
    .max(10, "Maximum 10 tools allowed"),

  categories: z
    .array(z.string())
    .min(1, "At least one category is required")
    .max(5, "Maximum 5 categories allowed"),

  status: z.enum(["draft", "published", "archived"]),

  projectUrl: z.string().regex(URL_PATTERN, "Invalid project URL").optional(),

  copyright: CopyrightSchema,
});

// Single validation middleware that handles both create and update
export const validateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    // If it's an update (PATCH request), make all fields optional
    const schema =
      req.method === "PUT" ? ProjectSchema.partial() : ProjectSchema;

    await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    return res.status(500).json({ success: false, error: "Validation error" });
  }
};
