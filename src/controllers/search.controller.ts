import { NextFunction, Request, Response, RequestHandler } from "express";
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
import { AppError, success } from "../utils/responseTypes";
import logger from "../logs/logger";

class SearchController {
  private static normalizePagination(
    options: { page?: string; limit?: string } = {},
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

  private static buildPaginationResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): { data: T[]; pagination: PaginationMetadata } {
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

  private static buildUserSearchPipeline(
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
          { fullName: { $regex: searchQuery, $options: "i" } },
          { "profile.profession": { $regex: searchQuery, $options: "i" } },
        ],
      },
    };

    if (filter === "isAvailableForHire") {
      matchStage.$match["profile.availableForHire"] = true;
    }

    const sortMapping: { [key: string]: string } = {
      followers: "followers",
      fullName: "fullName",
    };
    const sortField = sortMapping[sortBy] || "fullName";

    return [
      matchStage,
      {
        $project: {
          _id: { $toString: "$_id" },
          fullName: 1,
          email: 1,
          profile: {
            avatar: 1,
            profession: 1,
            availableForHire: 1,
          },
        },
      },
      { $sort: { [sortField]: sortOrder === "asc" ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
  }

  private static buildProjectSearchQuery(
    params: ProjectQueryParams
  ): mongoose.FilterQuery<any> {
    const { query, category, tag, status = "published", filter } = params;
    const baseConditions: mongoose.FilterQuery<any> = { status };
    const searchConditions: mongoose.FilterQuery<any>[] = [];

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

  private static buildProjectAggregationPipeline(
    matchQuery: mongoose.FilterQuery<any>,
    skip?: number,
    limit?: number,
    sortBy = "publishedAt",
    sortOrder: "asc" | "desc" = "desc"
  ): mongoose.PipelineStage[] {
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
        $unwind: { path: "$creatorDetails", preserveNullAndEmptyArrays: true },
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
          collaborators: 1,
          status: 1,
          creator: {
            _id: { $toString: "$creatorDetails._id" },
            fullName: "$creatorDetails.fullName",
            email: "$creatorDetails.email",
            profile: {
              avatar: "$creatorDetails.profile.avatar",
              profession: "$creatorDetails.profile.profession",
              availableForHire: "$creatorDetails.profile.availableForHire",
            },
          },
        },
      },
      { $sort: { [sortField]: order } },
    ];

    if (typeof skip === "number") pipeline.push({ $skip: skip });
    if (typeof limit === "number") pipeline.push({ $limit: limit });

    return pipeline;
  }

  static searchProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = req.query as ProjectQueryParams;
      const { pageNumber, limitNumber, skip } = this.normalizePagination(
        { page: params.page, limit: params.limit },
        20,
        100
      );

      const matchQuery = this.buildProjectSearchQuery(params);
      // if (!params.query && !params.category && !params.tag) {
      //   matchQuery.featured = true;
      // }

      const [countResult, projects] = await Promise.all([
        Project.aggregate([
          ...this.buildProjectAggregationPipeline(matchQuery, 0, 10),
          { $count: "totalProjects" },
        ]),
        Project.aggregate(
          this.buildProjectAggregationPipeline(
            matchQuery,
            skip,
            limitNumber,
            params.sortBy,
            params.sortOrder
          )
        ),
      ]);

      const totalProjects = countResult[0]?.totalProjects || 0;
      const response = this.buildPaginationResponse(
        projects,
        totalProjects,
        pageNumber,
        limitNumber
      );
      res.status(200).json(
        success({
          data: response,
          message: projects.length
            ? "Projects found successfully"
            : "No projects found",
        })
      );
    } catch (error) {
      logger.error("Error searching projects:", error);
      next(new AppError("Error while searching projects", 500));
    }
  };

  static searchUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { query, page, limit, sortBy, sortOrder, filter } =
        req.query as UserQueryParams;

      if (!query || typeof query !== "string" || query.trim() === "") {
        next(new AppError("Invalid search query", 400));
        return;
      }

      const { pageNumber, limitNumber, skip } = this.normalizePagination(
        { page, limit },
        20,
        100
      );

      const searchQuery = query.trim();

      const [countResult, users] = await Promise.all([
        User.aggregate([
          ...this.buildUserSearchPipeline(searchQuery, 0, limitNumber),
          { $count: "totalUsers" },
        ]),
        User.aggregate<MiniUser>(
          this.buildUserSearchPipeline(
            searchQuery,
            skip,
            limitNumber,
            sortBy,
            sortOrder,
            filter as "featured" | "isAvailableForHire"
          )
        ),
      ]);

      const totalUsers = countResult[0]?.totalUsers || 0;
      const response = this.buildPaginationResponse(
        users,
        totalUsers,
        pageNumber,
        limitNumber
      );

      res.status(200).json(
        success({
          data: response,
          message: users.length ? "Users found successfully" : "No users found",
        })
      );
    } catch (error) {
      logger.error("Error searching users:", error);
      next(new AppError("Error while searching users", 500));
    }
  };
}

export default SearchController;
