import { NextFunction, Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import logger from "../logs/logger";
import { AppError, success } from "../utils/responseTypes";
import { BUCKET_NAME, s3Client } from "../utils/AWSHelpers";

interface FileUploadRequest {
  filename: string;
  contentType: string;
}

interface SignedUrlResponse {
  uploadUrl: string;
  key: string;
}

class UploadController {
  private async generateSignedUrlForFile(file: FileUploadRequest): Promise<SignedUrlResponse> {
    const { filename, contentType } = file;
    const fileExtension = filename.split(".").pop();
    const fileType = contentType.includes("video") ? "video" : "image";
    const uniqueFilename = `${fileType}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    return { uploadUrl, key: uniqueFilename };
  }

  public async generateUploadUrls(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { files } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
      logger.error("Invalid input: files array is empty or not an array");
      next(new AppError("Invalid input: files must be a non-empty array", 400));
      return;
    }

    try {
      const signedUrls = await Promise.all(
        files.map(file => this.generateSignedUrlForFile(file))
      );

      res.status(200).json(
        success({
          data: signedUrls,
          message: "Upload URLs generated successfully",
        })
      );
    } catch (error) {
      logger.error("Failed to generate upload URLs:", error);
      next(new AppError("Failed to generate upload URLs", 500));
    }
  }
}

export default UploadController;