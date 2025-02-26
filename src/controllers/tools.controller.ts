import { Request, Response, NextFunction } from "express";
import { AppError, success } from "../utils/responseTypes";
import logger from "../logs/logger";
import ToolService from "../services/ToolsService"; // Adjust the import path as needed

class ToolController {
  static async createTool(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { name, icon } = req.body;

    if (!name || name.trim().length === 0) {
      logger.error("Tool name is required");
      next(new AppError("Tool name is required", 400));
      return;
    }

    try {
      const tool = await ToolService.createTool(name, icon);

      res.status(201).json(
        success({
          data: tool,
          message: "Tool created successfully",
        })
      );
    } catch (error) {
      logger.error("Error creating tool:", error);
      next(new AppError("Error creating tool", 500));
    }
  }

  static async getAllTools(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tools = await ToolService.getAllTools();

      res.status(200).json(
        success({
          data: tools,
          message: "Tools fetched successfully",
        })
      );
    } catch (error) {
      logger.error("Error fetching tools:", error);
      next(new AppError("Error fetching tools", 500));
    }
  }

  static async deleteTool(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { toolId } = req.params;

    try {
      const tool = await ToolService.deleteTool(toolId);
      if (!tool) {
        logger.error(`Tool not found: ${toolId}`);
        next(new AppError("Tool not found", 404));
        return;
      }

      res.status(200).json(
        success({
          data: tool,
          message: "Tool deleted successfully",
        })
      );
    } catch (error) {
      logger.error("Error deleting tool:", error);
      next(new AppError("Error deleting tool", 500));
    }
  }
}

export default ToolController;
