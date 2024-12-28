import { NextFunction, Request, Response } from "express";
import asyncHandler from "../middlewares/asyncHanlder";
import {
  PaginationMetadata,
  ProjectQueryParams,
  UserQueryParams,
} from "../types/miscellaneous";
import mongoose from "mongoose";
import User from "../models/user/user.model";
import Project from "../models/project/project.model";
import { MiniUser } from "../types/user";
import { AppError } from "../middlewares/error";

// Generic pagination utility
interface PaginationOptions {
  page?: string;
  limit?: string;
}

interface SearchResult<T> {
  data: T[];
  pagination: PaginationMetadata;
}

class SearchUtility {
  static normalizePagination(
    options: PaginationOptions = {},
    defaultLimit = 20,
    maxLimit = 100
  ): { pageNumber: number; limitNumber: number; skip: number } {
    const { page = "1", limit = defaultLimit } = options;
    const pageNumber = Math.max(1, parseInt(page as string, 10));
    const limitNumber = Math.min(
      maxLimit,
      Math.max(1, parseInt(limit as string, 10))
    );
    const skip = (pageNumber - 1) * limitNumber;

    return { pageNumber, limitNumber, skip };
  }

  /**
   * Builds a standard response with pagination
   */
  static buildPaginationResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): SearchResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        pages: totalPages,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

class UserSearchUtility {
  static buildUserSearchPipeline(
    searchQuery?: string,
    skip?: number,
    limit?: number,
    sortBy: string = "followers",
    sortOrder: "asc" | "desc" = "desc",
    filter?: "featured" | "isAvailableForHire"
  ): mongoose.PipelineStage[] {
    const matchStage: any = {
      $match: {
        $or: [
          {
            fullName: {
              $regex: searchQuery,
              $options: "i",
            },
          },
          {
            "profile.profession": {
              $regex: searchQuery,
              $options: "i",
            },
          },
        ],
      },
    };

    if (filter === "isAvailableForHire" && filter !== undefined) {
      matchStage.$match["profile.availableForHire"] = true;
    }

    const sortMapping: { [key: string]: string } = {
      followers: "followers",
      fullName: "fullName",
    };
    const sortField = sortMapping[sortBy] || "fullName";

    return [
      // First stage: Match users
      matchStage,
      // Project the necessary fields
      {
        $project: {
          _id: { $toString: "$_id" },
          fullName: 1,
          avatar: "$profile.avatar",
          profession: "$profile.profession",
          projects: {
            $map: {
              input: "$projects",
              as: "project",
              in: { $toString: "$$project" },
            },
          },
          availableForHire: "$profile.availableForHire",
        },
      },

      // Dynamic sorting stage
      {
        $sort: { [sortField]: sortOrder === "asc" ? 1 : -1 },
      },
      { $skip: skip },
      { $limit: limit },
    ];
  }
}

class ProjectSearchUtility {
  static buildSearchQuery(
    params: ProjectQueryParams
  ): mongoose.FilterQuery<any> {
    const { query, category, tag, status = "published", filter } = params;

    const baseConditions: mongoose.FilterQuery<any> = { status };

    const searchConditions: mongoose.FilterQuery<any>[] = [];

    // Filter logic
    if (filter === "featured") {
      baseConditions.featured = true;
    }
    if (query && category) {
      searchConditions.push({
        $and: [
          { category: { $regex: category, $options: "i" } },
          {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
              { tags: { $regex: query, $options: "i" } },
            ],
          },
        ],
      });
    } else if (category && !query) {
      searchConditions.push({
        category: { $regex: category, $options: "i" },
      });
    } else if (query && !category) {
      searchConditions.push({
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
        ],
      });
    }

    if (tag) {
      searchConditions.push({
        tags: { $elemMatch: { $regex: tag, $options: "i" } },
      });
    }

    return {
      ...baseConditions,
      ...(searchConditions.length > 0 && { $and: searchConditions }),
    };
  }

  static buildAggregationPipeline(
    matchQuery: mongoose.FilterQuery<any>,
    skip?: number,
    limit?: number,
    sortBy = "publishedAt",
    sortOrder: "asc" | "desc" = "desc"
  ): mongoose.PipelineStage[] {
    // Mapping of sortBy to actual fields
    const sortMapping: { [key: string]: string } = {
      title: "title",
      likes: "stats.likes",
      views: "stats.views",
      createdAt: "createdAt",
    };

    const sortField = sortMapping[sortBy] || "createdAt";
    const order = sortOrder === "asc" ? 1 : -1;

    const pipeline: mongoose.PipelineStage[] = [
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creatorDetails",
        },
      },
      {
        $unwind: {
          path: "$creatorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: { $toString: "$_id" },
          title: 1,
          thumbnail: 1,
          category: 1,
          stats: 1,
          featured: 1,
          publishedAt: 1,
          status: 1,
          creator: {
            _id: { $toString: "$creatorDetails._id" },
            fullName: "$creatorDetails.fullName",
            avatar: "$creatorDetails.profile.avatar",
            profession: "$creatorDetails.profile.profession",
            projects: {
              $map: {
                input: "$creatorDetails.projects",
                as: "project",
                in: { $toString: "$$project" },
              },
            },
            availableForHire: "$creatorDetails.profile.availableForHire",
          },
        },
      },
      { $sort: { [sortField]: order } },
    ];

    if (typeof skip === "number") pipeline.push({ $skip: skip });
    if (typeof limit === "number") pipeline.push({ $limit: limit });

    return pipeline;
  }
}

// Controller remains the same as in your previous implementation
export const searchProjects = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const params = req.query as ProjectQueryParams;
    const { pageNumber, limitNumber, skip } = SearchUtility.normalizePagination(
      { page: params.page, limit: params.limit },
      20,
      100
    );

    const matchQuery = ProjectSearchUtility.buildSearchQuery(params);
    // build with only featured field if no query is provided
    if (!params.query && !params.category && !params.tag) {
      matchQuery.featured = true;
    }

    try {
      const [countResult, projects] = await Promise.all([
        Project.aggregate([
          ...ProjectSearchUtility.buildAggregationPipeline(matchQuery, 0, 10),
          { $count: "totalProjects" },
        ]),
        Project.aggregate(
          ProjectSearchUtility.buildAggregationPipeline(
            matchQuery,
            skip,
            limitNumber,
            params.sortBy,
            params.sortOrder
          )
        ),
      ]);

      const totalProjects = countResult[0]?.totalProjects || 0;

      const response = SearchUtility.buildPaginationResponse(
        projects,
        totalProjects,
        pageNumber,
        limitNumber
      );

      res.status(200).json({
        message: projects.length
          ? "Projects found successfully"
          : "No projects found",
        ...response,
      });
    } catch (error: any) {
      return next(
        new AppError("Error while searching projects" + error.message, 500)
      );
    }
  }
);

// controllers
// User Search Controller
export const searchUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { query, page, limit, sortBy, sortOrder, filter } =
      req.query as UserQueryParams;

    // Validate query parameter
    if (!query || typeof query !== "string" || query.trim() === "") {
      return next(new AppError("Invalid search query", 400));
    }

    // Normalize pagination
    const { pageNumber, limitNumber, skip } = SearchUtility.normalizePagination(
      { page, limit },
      20,
      100
    );

    // Prepare the search query
    const searchQuery = query.trim();

    try {
      // Execute aggregations
      const [countResult, users] = await Promise.all([
        User.aggregate([
          ...UserSearchUtility.buildUserSearchPipeline(
            searchQuery,
            0,
            limitNumber
          ),
          { $count: "totalUsers" },
        ]),
        User.aggregate<MiniUser>(
          UserSearchUtility.buildUserSearchPipeline(
            searchQuery,
            skip,
            limitNumber,
            sortBy,
            sortOrder,
            filter as "featured" | "isAvailableForHire"
          )
        ),
      ]);

      // Get total users
      const totalUsers = countResult[0]?.totalUsers || 0;

      // Build and send response
      const response = SearchUtility.buildPaginationResponse(
        users,
        totalUsers,
        pageNumber,
        limitNumber
      );

      res.status(200).json({
        message: users.length ? "Users found successfully" : "No users found",
        ...response,
      });
    } catch (error: any) {
      return next(
        new AppError("Error while searching users: " + error.message, 500)
      );
    }
  }
);

export default {
  searchUsers,
  searchProjects,
};
