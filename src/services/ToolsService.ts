import Tool from "../models/others/tools.model";

class ToolService {
  // Create a new tool
  static async createTool(name: string, icon?: string) {
    return Tool.create({ name, icon });
  }

  // Get all tools
  static async getAllTools() {
    return Tool.find().lean();
  }

  // Delete a tool by ID
  static async deleteTool(toolId: string) {
    const tool = await Tool.findById(toolId);
    if (!tool) return null;

    await tool.deleteOne();
    return tool;
  }
}

export default ToolService;
