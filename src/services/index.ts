import {
  Model,
  Types,
  Document,
  FilterQuery,
  UpdateQuery,
  ObjectId,
} from "mongoose";

export default class DbService<T extends Document> {
  constructor(protected model: Model<T>) {}

  // Find a document by ID
  findById = async (id: string, populate?: string): Promise<T | null> => {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ID");
    return this.model
      .findById(id)
      .populate(populate || "")
      .exec();
  };

  // Find one document by a filter
  findOne = async (
    filter: FilterQuery<T>,
    select?: string
  ): Promise<T | null> => {
    return this.model
      .findOne(filter)
      .select(select || "")
      .exec();
  };

  // Create a new document
  create = async (data: Partial<T>): Promise<T> => {
    return this.model.create(data);
  };

  // Update a document by ID
  update = async (
    id: string,
    data: UpdateQuery<T>,
    options = { new: true }
  ): Promise<T | null> => {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ID");
    return this.model.findByIdAndUpdate(id, data, options).exec();
  };

  // Check if a document exists by a filter
  exists = async (filter: FilterQuery<T>): Promise<boolean> => {
    return !!(await this.model.exists(filter));
  };

  // Delete a document by ID
  delete = async (id: ObjectId | any): Promise<boolean> => {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ID");
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  };

  // Find multiple documents with filters, pagination, and sorting
  findAll = async (
    filter: FilterQuery<T> = {},
    select = "",
    limit = 10,
    skip = 0,
    sort = "createdAt"
  ): Promise<T[]> => {
    return this.model
      .find(filter)
      .select(select)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .exec();
  };

  // Bulk update documents
  updateMany = async (
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<number> => {
    const result = await this.model.updateMany(filter, data).exec();
    return result.modifiedCount;
  };
}
