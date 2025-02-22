import { Request, Response, NextFunction, RequestHandler } from "express";
import asyncHandler from "../middlewares/asyncHanlder";
import { AppError, success } from "../utils/responseTypes";
import Tool from "../models/others/tools.model";
import logger from "../logs/logger";

class ToolController {
  public  createTool = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      try {
        const { name, icon } = req.body;

        if (!name || name.trim().length === 0) {
          logger.error("Tool name is required");
          return next(new AppError("Tool name is required", 400));
        }

        const tool = await Tool.create({
          name,
          icon,
        });

        return res.status(201).json(
          success({
            data: tool,
            message: "Tool created successfully",
          })
        );
      } catch (error) {
        logger.error("Error creating tool:", error);
        return next(new AppError("Error creating tool", 500));
      }
    }
  ) as RequestHandler;

  public  getAllTools = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      try {
        const tools = await Tool.find().lean();

        return res.status(200).json(
          success({
            data: tools,
            message: "Tools fetched successfully",
          })
        );
      } catch (error) {
        logger.error("Error fetching tools:", error);
        return next(new AppError("Error fetching tools", 500));
      }
    }
  ) as RequestHandler;

  public  deleteTool = asyncHandler(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void | Response> => {
      try {
        const { toolId } = req.params;

        const tool = await Tool.findById(toolId);
        if (!tool) {
          logger.error(`Tool not found: ${toolId}`);
          return next(new AppError("Tool not found", 404));
        }

        await tool.deleteOne();

        return res.status(200).json(
          success({
            data: tool,
            message: "Tool deleted successfully",
          })
        );
      } catch (error) {
        logger.error("Error deleting tool:", error);
        return next(new AppError("Error deleting tool", 500));
      }
    }
  ) as RequestHandler;
}

export default ToolController;