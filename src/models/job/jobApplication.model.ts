import { Schema, model } from "mongoose";
import { JobApplicationDocument } from "../../types/jobApplication";

const JobApplicationSchema = new Schema<JobApplicationDocument>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attachedProjects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    coverNote: { type: String, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "reviewing", "shortlisted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true, versionKey: false },
);

JobApplicationSchema.index({ jobId: 1, applicant: 1 }, { unique: true });
JobApplicationSchema.index({ jobId: 1, status: 1 });
JobApplicationSchema.index({ applicant: 1 });

const JobApplication = model<JobApplicationDocument>(
  "JobApplication",
  JobApplicationSchema,
);

export default JobApplication;
