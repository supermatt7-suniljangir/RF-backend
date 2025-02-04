import { NextFunction, Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import asyncHandler from "../middlewares/asyncHanlder";
import logger from "../logs/logger";
import { AppError } from "../middlewares/error";
import { BUCKET_NAME, s3Client } from "../utils/AWSHelpers";

export const generateUploadUrls = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { files } = req.body; // Expecting an array of files with `filename` and `contentType`
    if (!Array.isArray(files) || files.length === 0) {
      return next(
        new AppError("Invalid input: files must be a non-empty array", 400)
      );
    }

    try {
      // Generate signed URLs for each file
      const signedUrls = await Promise.all(
        files.map(async (file) => {
          const { filename, contentType } = file;
          const fileExtension = filename.split(".").pop();
          const uniqueFilename = `media/${uuidv4()}.${fileExtension}`;
          const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: uniqueFilename,
            ContentType: contentType,
          });
          const uploadUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 300,
          });
          console.log(uploadUrl);
          return { uploadUrl, key: uniqueFilename };
        })
      );

      res.json(signedUrls); // Return an array of URLs and keys
    } catch (error) {
      logger.error("Failed to generate upload URLs", error);
      return next(new AppError("Failed to generate upload URLs", 500));
    }
  }
);
