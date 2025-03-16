import { NextFunction, Request, Response } from "express";
import { AppError, success } from "../utils/responseTypes";
import logger from "../config/logger";
import ConnectService from "../services/ConnectService";
import Pagination from "../utils/Pagination";

class ConnectController {
  /**
   * Fetch messages between two users with pagination.
   */
  static async getChatHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { user } = req;
    console.log(req.query);
    const { page = 1, limit = 100, recipient } = req.query;
    logger.info(`the user is ${user} and the recipient is ${recipient}`);

    if (!(user && recipient)) {
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

      // Fetch messages
      const { messages, total } = await ConnectService.getMessages(
        user._id,
        recipient as string,
        skip,
        limitNumber,
      );
      const data = Pagination.buildPaginationResponse(
        messages,
        total,
        pageNumber,
        limitNumber,
      );
      res.status(200).json(
        success({
          data,
          message: "Messages fetched successfully",
        }),
      );
    } catch (error) {
      logger.error("Error fetching messages:", error);
      next(new AppError("Error fetching messages", 500));
    }
  }

  /**
   * Fetch recent conversation list for a user.
   */
  static async getRecentConversations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { user } = req;

    if (!user) {
      next(new AppError("Unauthorized", 401));
      return;
    }

    try {
      const conversations = await ConnectService.getRecentConversations(
        user._id,
      );

      res.status(200).json(
        success({
          data: conversations,
          message: "Recent conversations fetched successfully",
        }),
      );
    } catch (error) {
      logger.error("Error fetching recent conversations:", error);
      next(new AppError("Error fetching recent conversations", 500));
    }
  }

  /**
   * Delete a conversation between two users.
   */
  /**
   * Delete a conversation with a specific recipient.
   */
  static async deleteConversation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { user } = req;
    const { recipientId } = req.params;

    if (!user || !recipientId) {
      next(new AppError("Both user and recipient IDs are required", 400));
      return;
    }

    try {
      await ConnectService.deleteConversation(user._id, recipientId);

      res.status(200).json(
        success({
          message: "Conversation deleted successfully",
        }),
      );
    } catch (error) {
      logger.error("Error deleting conversation:", error);
      next(new AppError("Error deleting conversation", 500));
    }
  }
}

export default ConnectController;
