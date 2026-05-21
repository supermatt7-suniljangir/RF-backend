import { NextFunction, Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger";
import { AppError, success } from "../utils/responseTypes";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../config/configURLs";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

interface FileUploadRequest {
  filename: string;
  contentType: string;
  id?: number;
}

interface SignedUrlResponse {
  uploadUrl: string;
  key: string;
  id?: number;
}
class UploadController {
  private static generateSignedUrlForFile(
    file: FileUploadRequest,
  ): SignedUrlResponse {
    const folder = "RF/projects";

    const key = uuidv4();

    const timestamp = Math.round(Date.now() / 1000);

    logger.info("file is: ", file);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        public_id: key,
        folder,
      },
      CLOUDINARY_API_SECRET!,
    );

    const signedUploadUrl =
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload` +
      `?api_key=${CLOUDINARY_API_KEY}` +
      `&timestamp=${timestamp}` +
      `&public_id=${key}` +
      `&folder=${folder}` +
      `&signature=${signature}`;

    return {
      id: file.id,
      uploadUrl: signedUploadUrl,
      key: `${folder}/${key}`,
    };
  }

  static generateUploadUrls = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { files }: { files: FileUploadRequest[] } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      logger.error("Invalid input: files array is empty or not an array");
      next(new AppError("Invalid input: files must be a non-empty array", 400));
      return;
    }
    if (files.length > 10) {
      next(
        new AppError(
          "Invalid input: You can only upload 10 files at a time",
          400,
        ),
      );
      return;
    }
    try {
      const signedUrls = files.map((file) =>
        this.generateSignedUrlForFile(file),
      );

      res.status(200).json(
        success({
          data: signedUrls,
          message: "Upload URLs generated successfully",
        }),
      );
    } catch (error) {
      logger.error("Failed to generate upload URLs:", error);
      next(new AppError("Failed to generate upload URLs", 500));
    }
  };
  static deleteUploadedFiles = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { publicIds }: { publicIds: string[] } = req.body;

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      logger.error("Invalid input: publicIds array is empty or not an array");
      next(
        new AppError("Invalid input: publicIds must be a non-empty array", 400),
      );
      return;
    }

    try {
      await cloudinary.api.delete_resources(publicIds);

      res.status(200).json(
        success({
          data: null,
          message: "Files deleted successfully",
        }),
      );
    } catch (error) {
      logger.error("Failed to delete files from Cloudinary:", error);
      next(new AppError("Failed to delete files from Cloudinary", 500));
    }
  };
}

export default UploadController;
