import { Document, Types } from "mongoose";

export type ApplicationStatus = "pending" | "reviewing" | "shortlisted" | "rejected";

export interface IJobApplication {
  _id?: Types.ObjectId;
  jobId: Types.ObjectId | string;
  applicant: Types.ObjectId | string;
  attachedProjects?: (Types.ObjectId | string)[];
  coverNote?: string;
  status: ApplicationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobApplicationDocument extends Document {
  jobId: Types.ObjectId;
  applicant: Types.ObjectId;
  attachedProjects?: Types.ObjectId[];
  coverNote?: string;
  status: ApplicationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
