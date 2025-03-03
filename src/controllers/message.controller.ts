import { Request, Response, NextFunction } from "express";
import { AppError, success } from "../utils/responseTypes";
import logger from "../config/logger";
import MessageService from "../services/MessageService";
import Pagination from "../utils/Pagination";

class MessageController {
  /**
   * Fetch messages between two users with pagination
   */
  static async getMessages(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { user1, user2 } = req.body;
    const { page, limit } = req.query;

    if (!user1 || !user2) {
      logger.error("Both user IDs are required");
      next(new AppError("Both user IDs are required", 400));
      return;
    }

    try {
      // Normalize pagination params
      const { pageNumber, limitNumber, skip } = Pagination.normalizePagination({
        page: page as string,
        limit: limit as string,
      });

      // Fetch messages with pagination
      const { messages, total } = await MessageService.getMessages(
        user1,
        user2,
        skip,
        limitNumber
      );

      res.status(200).json(
        success({
          ...Pagination.buildPaginationResponse(
            messages,
            total,
            pageNumber,
            limitNumber
          ),
          message: "Messages fetched successfully",
        })
      );
    } catch (error) {
      logger.error("Error fetching messages:", error);
      next(new AppError("Error fetching messages", 500));
    }
  }
}

export default MessageController;
