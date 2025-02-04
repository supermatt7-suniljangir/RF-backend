import { Request, Response, NextFunction } from "express";
import asyncHandler from "../middlewares/asyncHanlder";
import { AppError } from "../middlewares/error";
import Tool from "../models/others/tools.model";
import logger from "../logs/logger";

// Controller to create a new tool
export const createTool = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { name, icon } = req.body;

    try {
      if (!name || name.trim().length === 0) {
        logger.error("Tool name is required");
        return next(new AppError("Tool name is required", 400));
      }

      // Create the new tool
      const tool = await Tool.create({
        name,
        icon,
      });

      res.status(201).json({
        success: true,
        message: "Tool created successfully",
        data: tool,
      });
    } catch (error) {
      logger.error(`Error creating tool: ${error}`);
      return next(new AppError("Error creating tool", 500));
    }
  }
);

// Controller to get all tools
export const getAllTools = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      // Fetch all tools from the database
      const tools = await Tool.find().lean(); // Use lean for performance

      res.status(200).json({
        success: true,
        data: tools,
      });
    } catch (error) {
      logger.error(`Error fetching tools: ${error}`);
      next(new AppError("Error fetching tools", 500));
    }
  }
);

// Controller to delete a tool by ID
export const deleteTool = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { toolId } = req.params;

    try {
      // Find the tool by ID
      const tool = await Tool.findById(toolId);
      if (!tool) {
        logger.error(`Tool not found: ${toolId}`);
        return next(new AppError("Tool not found", 404));
      }

      // Delete the tool
      await tool.deleteOne();

      res.status(200).json({
        success: true,
        message: "Tool deleted successfully",
      });
    } catch (error) {
      logger.error(`Error deleting tool: ${error}`);
      next(new AppError("Error deleting tool", 500));
    }
  }
);