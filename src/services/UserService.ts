import DbService from "./";
import { FilterQuery, UpdateQuery } from "mongoose";
import { UserDocument } from "../types/user";
import User from "../models/user/user.model";

class UserService {
  private dbService = new DbService<UserDocument>(User);

  // Get user by ID
  async getUserById(id: string) {
    return this.dbService.findById(id);
  }

  // Get user by email
  async getUserByEmail(email: string, includePassword = false) {
    const projection = includePassword ? "+password" : "";
    return this.dbService.findOne({ email }, projection);
  }

  // Check if a user exists by email
  async checkUserExists(email: string) {
    return this.dbService.exists({ email });
  }

  // Create a new user
  async createUser(userData: Partial<UserDocument>) {
    return this.dbService.create(userData);
  }

  // Update a user by ID
  async updateUserById(id: string, updates: UpdateQuery<UserDocument>) {
    return this.dbService.update(id, updates, { new: true });
  }

  // Fetch all users with optional filters
  async getAllUsers(filter: FilterQuery<UserDocument> = {}) {
    return this.dbService.findAll(filter);
  }

  // Delete a user by ID
  async deleteUserById(id: string) {
    return this.dbService.delete(id);
  }
}

export default new UserService();
