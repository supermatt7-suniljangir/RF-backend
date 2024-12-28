import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import Project from "../models/project/project.model";
import User from "../models/user/user.model";
import { AppError } from "../middlewares/error";

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      return next(
        new AppError("Authentication required to fetch projects", 401)
      );
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
      return next(
        new AppError(
          `MongoDB error fetching user projects: ${error.message}`,
          500
        )
      );
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
    // Fetch the project by ID and ensure the user owns it
    let project = await Project.findOne({ _id: req.params.id });
    if (!project) {
      return next(new AppError("Project not found or unauthorized", 404));
    }

    // Ensure nested fields are always initialized
    if (!project.media) {
      project.media = [];
    }
    if (!project.tools) {
      project.tools = [];
    }
    if (!project.collaborators) {
      project.collaborators = [];
    }

    // Handle top-level project updates
    Object.keys(req.body).forEach((field) => {
      if (
        field in project!.schema.paths &&
        field !== "media" &&
        field !== "tools" &&
        field !== "collaborators"
      ) {
        (project as any)[field] = req.body[field];
      }
    });

    // Handle nested `media` updates
    if (req.body.media) {
      req.body.media.forEach((mediaItem: any) => {
        if (mediaItem._id) {
          const mediaIndex = project.media.findIndex(
            (item) => item._id!.toString() === mediaItem._id
          );
          if (mediaIndex > -1) {
            project.media[mediaIndex] = {
              ...project.media[mediaIndex],
              ...mediaItem,
            };
          }
        } else {
          // Add new media item
          project.media.push(mediaItem);
        }
      });
    }

    // Handle nested `tools` updates
    if (req.body.tools) {
      project.tools.push(...req.body.tools);
    }

    // Handle nested `collaborators` updates
    if (req.body.collaborators) {
      project.collaborators = req.body.collaborators; // Replace collaborators array
    }

    // Update timestamps
    project.updatedAt = new Date();

    await project.save();

    const updatedProject = await Project.findById(project._id).populate([
      "creator",
      "collaborators",
    ]);

    if (!updatedProject) {
      return next(new AppError("Error fetching updated project", 500));
    }

    res.status(200).json({
      success: true,
      data: updatedProject,
    });
  } catch (error: any) {
    return next(new AppError(error.message, 500));
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate({
      path: "creator",
      select:
        "fullName profile.avatar profile.profession profile.availableForHire projects",
      transform: (doc) => {
        if (!doc) return null;
        return {
          _id: doc._id,
          fullName: doc.fullName,
          avatar: doc.profile?.avatar,
          profession: doc.profile?.profession,
          projects: doc.projects || [],
          availableForHire: doc.profile?.availableForHire || false,
        };
      },
    });
    if (!project) {
      return next(new AppError("Project not found", 404));
    }
    if (project.status === "published") {
      await Project.findByIdAndUpdate(id, { $inc: { "stats.views": 1 } });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(new AppError(`Error fetching project: ${error}`, 500));
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
