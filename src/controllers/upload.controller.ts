// uploadController.ts
import { NextFunction, Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import asyncHandler from "../middlewares/asyncHanlder";
import logger from "../logs/logger";
import { AppError } from "../middlewares/error";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export const generateUploadUrl = asyncHandler(
  async (req: Request, res: Response, next:NextFunction) => {
    const { filename, contentType } = req.body;

    const fileExtension = filename.split(".").pop();
    const uniqueFilename = `media/${
      req.user?._id
    }/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      ContentType: contentType,
    });
    try {
      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 300,
      });

      res.json({
        uploadUrl,
        key: uniqueFilename,
      });
    } catch (error) {
      logger.error("Failed to generate upload URL", error);
      return next(new AppError("Failed to generate upload URL", 500));
    }
  }
);
