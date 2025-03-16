import { Schema, model } from "mongoose";
import { ITools } from "../../types/project";

// Tool Schema for global list of tools
const ToolSchema = new Schema<ITools>(
  {
    name: { type: String, required: true },
    icon: String,
  },
  { timestamps: true, versionKey: false },
);

const Tool = model("Tool", ToolSchema);
export default Tool;
