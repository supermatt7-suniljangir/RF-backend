import { Request, Response } from "express";
import { Types } from "mongoose";
import Project from "../models/project/project.model";

export const createProject = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const projectData = req.body;
    projectData.creator = req.user?._id;

    const project = new Project(projectData);
    await project.save();

    return res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "A project with this slug already exists",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Error creating project",
    });
  }
};

export const updateProject = async (
  req: Request,
  res: Response
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
      return res.status(404).json({
        success: false,
        error: "Project not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error updating project",
    });
  }
};

export const getProjectById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate(
      "creator",
      "name avatar"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
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
    return res.status(500).json({
      success: false,
      error: "Error fetching project",
    });
  }
};

export const searchProjects = async (
  req: Request,
  res: Response
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
    return res.status(500).json({
      success: false,
      error: "Error searching projects",
    });
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

// v2:
/*
// 1. Basic Search with Regex (Simple but Limited)
export const searchProjectsWithRegex = async (req: Request, res: Response) => {
  try {
    const { 
      query, 
      tags, 
      page = 1, 
      limit = 10 
    } = req.query;

    const queryOptions: any = { status: 'published' };

    // Partial match for title or slug
    if (query) {
      queryOptions.$or = [
        { title: { $regex: String(query), $options: 'i' } },  // 'i' for case-insensitive
        { slug: { $regex: String(query), $options: 'i' } },
        { description: { $regex: String(query), $options: 'i' } }
      ];
    }

    // Partial match for tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      queryOptions['tags.name'] = { 
        $in: tagArray.map(tag => new RegExp(String(tag), 'i')) 
      };
    }

    const projects = await Project.find(queryOptions)
      .sort({ publishedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({ success: true, data: projects });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Search failed' });
  }
};

*/
