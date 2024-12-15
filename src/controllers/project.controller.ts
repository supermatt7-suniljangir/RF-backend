import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import { AppError } from "../middlewares/error";

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await Project.find({ status: "published" })
      .select("title thumbnail stats creator featured publishedAt status")
      .limit(10)
      .populate("creator", "fullName profile.avatar");

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    next(new AppError("Failed to fetch projects", 500));
  }
};

export const getProjectsByUser = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<any> => {
  try {
    // Use the authenticated user's ID if no userId is provided in params
    const userId = req.params.userId || req.user?._id;
    if (!userId) {
      return next(new AppError("Authentication required to fetch projects", 401));
    }
    
    // Ensure the ID is a valid MongoDB ObjectId
    const validatedUserId = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : null;

    if (!validatedUserId) {
      return next(new AppError("Invalid user ID format", 400));
    }

    // Determine if it's the user's own profile (using toString() for safe comparison)
    const isOwnProfile =
      req.user?._id && req.user._id.toString() === validatedUserId.toString();

    const projects = await Project.find({
      creator: validatedUserId,
      // Only filter by status if not the user's own profile
      ...(isOwnProfile ? {} : { status: "published" }),
    })
      .select(
        "title thumbnail stats creator collaborators featured publishedAt status"
      )
      .populate({
        path: "creator",
        select: "fullName email profile",
      })
      .populate({
        path: "collaborators",
        select: "fullName email profile",
      })
      .lean()
      .exec();

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error: any) {
    if (error.name === "MongoError" || error.name === "MongooseError") {
      return next(new AppError(`MongoDB error fetching user projects: ${error.message}`, 500));
    }

    next(new AppError("Error fetching user projects", 500));
  }
};

export const createProject = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<any> => {
  try {
    // Create the project first
    const projectData = req.body;
    projectData.creator = req.user?._id;

    const project = new Project(projectData);
    await project.save();

    // Add project ID to user's projects array
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { projects: project._id },
    });

    return res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError("A project with this slug already exists", 400));
    }

    next(new AppError("Error creating project", 500));
  }
};

export const updateProject = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating creator
    delete updates.creator;

    // Update timestamps
    updates.updatedAt = new Date();

    const project = await Project.findOneAndUpdate(
      {
        _id: id,
        creator: req.user?._id, // Ensure user owns the project
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!project) {
      return next(new AppError("Project not found or unauthorized", 404));
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(new AppError("Error updating project", 500));
  }
};

export const getProjectById = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate(
      "creator",
      "fullName profile.avatar"
    );

    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    // Increment views if project is published
    if (project.status === "published") {
      project.stats.views += 1;
      await project.save();
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(new AppError(`Error fetching project: ${error}`, 500));
  }
};

export const searchProjects = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<any> => {
  try {
    const {
      query,
      tags,
      page = 1,
      limit = 10,
      status = "published", // Default to published projects
    } = req.query;

    const queryOptions: any = { status };

    // Build search query
    if (query) {
      queryOptions.$or = [
        { title: new RegExp(String(query), "i") },
        { slug: new RegExp(String(query), "i") },
      ];
    }

    // Add tags filter if provided
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      queryOptions["tags.slug"] = { $all: tagArray };
    }

    // Calculate skip value for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get total count for pagination
    const total = await Project.countDocuments(queryOptions);

    // Fetch projects
    const projects = await Project.find(queryOptions)
      .populate("creator", "name avatar")
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(new AppError("Error searching projects", 500));
  }
};

// Additional helper function for checking project ownership
export const checkProjectOwnership = async (
  projectId: string,
  userId: Types.ObjectId
): Promise<boolean> => {
  const project = await Project.findOne({
    _id: projectId,
    creator: userId,
  });

  return !!project;
};