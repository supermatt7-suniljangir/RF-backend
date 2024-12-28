import { Schema, model, Document, Types } from "mongoose";
import { ITools, ProjectDocument } from "../../types/project";
import { title } from "process";

const ToolSchema = new Schema<ITools>({
  name: { type: String, required: true },
  icon: String,
});

const ProjectSchema = new Schema<ProjectDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 160 },
    thumbnail: {
      type: String,
      required: true,
    },
    media: [
      {
        _id: false,
        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        order: { type: Number, default: 0 },
      },
    ],
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: String }],
    tools: [ToolSchema],
    category: { type: String },
    stats: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },
    featured: { type: Boolean, default: false },
    publishedAt: Date,

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    projectUrl: String,
    copyright: {
      license: { type: String, required: true },
      allowsDownload: { type: Boolean, default: false },
      commercialUse: { type: Boolean, default: false },
    },
  },
  { timestamps: true, versionKey: false }
);
// Only essential indexes
ProjectSchema.index({ status: 1, publishedAt: -1 }); // For listing published projects by date
ProjectSchema.index({ featured: 1 }); // Index for filtering by featured status
ProjectSchema.index({ tags: 1 }); // Index for searching projects by tags (array index)
ProjectSchema.index({ title: 1 }); // Index for searching projects by title
ProjectSchema.index({ categories: 1 }); // For category-based searches
// Export model
const Project = model<ProjectDocument>("Project", ProjectSchema);
export default Project;
