import { Schema, model, Document, Types } from "mongoose";
import { IComment, Imedia, ITools } from "../../types/project";

interface IProject extends Document {
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  media: Imedia[];
  creator: Types.ObjectId;
  collaborators?: Types.ObjectId[];
  tags: string[];
  tools: ITools[];
  categories: string[];
  stats: {
    views: number;
    likes: number;
    saves: number;
    comments: number;
  };
  comments: IComment[];
  featured: boolean;
  publishedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  status: "draft" | "published";
  projectUrl?: string;
  copyright: {
    license: string;
    allowsDownload: boolean;
    commercialUse: boolean;
  };
}

const ToolSchema = new Schema<ITools>({
  name: { type: String, required: true },
  icon: String,
});

const CommentSchema = new Schema<IComment>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ProjectSchema = new Schema<IProject>(
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
      },
    ],
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: String }],
    tools: [ToolSchema],
    categories: [{ type: String }],
    stats: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },
    comments: [CommentSchema],
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
ProjectSchema.index({ creator: 1 }); // For fetching user's projects
ProjectSchema.index({ status: 1, publishedAt: -1 }); // For listing published projects by date
ProjectSchema.index({ featured: 1 }); // Index for filtering by featured status
ProjectSchema.index({ tags: 1 }); // Index for searching projects by tags (array index)
ProjectSchema.index({ creator: 1 }); // Index for fetching user's projects
ProjectSchema.index({ categories: 1 }); // For category-based searches
// Export model
const Project = model<IProject>("Project", ProjectSchema);
export default Project;
