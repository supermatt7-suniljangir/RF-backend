import { Schema, model } from "mongoose";
import { JobDocument } from "../../types/job";

const JobSchema = new Schema<JobDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    jobType: {
      type: String,
      enum: ["Full-Time", "Freelance", "Contract", "Internship"],
      required: true,
    },
    location: { type: String, default: "Remote" },
    budget: { type: String },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    employerType: {
      type: String,
      enum: ["individual", "company"],
      default: "individual",
    },
    companyName: { type: String },
    companyLogo: { type: String },
    category: { type: String },
    tags: [{ type: String }],
    requiredSkills: [{ type: String }],
    applyMethod: {
      type: {
        type: String,
        enum: ["internal", "external"],
        default: "internal",
      },
      externalUrl: { type: String },
    },
    applicationsCount: { type: Number, default: 0 },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  { timestamps: true, versionKey: false },
);

JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ postedBy: 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ jobType: 1 });

const Job = model<JobDocument>("Job", JobSchema);

export default Job;
