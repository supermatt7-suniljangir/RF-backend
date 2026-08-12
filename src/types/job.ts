import { Document, Types } from "mongoose";

export type JobTypeCategory = "Full-Time" | "Freelance" | "Contract" | "Internship";
export type EmployerType = "individual" | "company";
export type JobStatus = "open" | "closed";

export type ApplyMethodType = "internal" | "external";

export interface ApplyMethod {
  type: ApplyMethodType;
  externalUrl?: string;
}

export interface IJob {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  jobType: JobTypeCategory;
  location: string;
  budget?: string;
  postedBy: Types.ObjectId | string;
  employerType: EmployerType;
  companyName?: string;
  companyLogo?: string;
  category?: string;
  tags?: string[];
  requiredSkills?: string[];
  applyMethod?: ApplyMethod;
  applicationsCount?: number;
  expiresAt?: Date;
  status: JobStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobDocument extends Document {
  title: string;
  description: string;
  jobType: JobTypeCategory;
  location: string;
  budget?: string;
  postedBy: Types.ObjectId;
  employerType: EmployerType;
  companyName?: string;
  companyLogo?: string;
  category?: string;
  tags?: string[];
  requiredSkills?: string[];
  applyMethod?: ApplyMethod;
  applicationsCount?: number;
  expiresAt?: Date;
  status: JobStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
