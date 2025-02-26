import DbService from "./";
import Bookmark from "../models/others/bookmark.model";
import { IBookmark } from "../types/others";

class BookmarkService {
  private dbService = new DbService<IBookmark>(Bookmark);

  // Toggle bookmark
  async toggleBookmark(userId: string, projectId: string) {
    const bookmarkExists = await this.dbService.findOne({ userId, projectId });

    if (bookmarkExists) {
      await this.dbService.delete(bookmarkExists._id);
      return { bookmarked: false };
    } else {
      const newBookmark = await this.dbService.create({ userId, projectId });
      return { bookmarked: true, bookmark: newBookmark };
    }
  }

  // Get user bookmarks
  async getUserBookmarks(userId: string) {
    return Bookmark.find({ userId })
      .populate({
        path: "projectId",
        select: "title thumbnail stats category publishedAt status",
        populate: {
          path: "creator",
          select:
            "_id fullName profile.avatar profile.profession email profile.availableForHire",
        },
      })
      .lean();
  }

  // Check if user has bookmarked a project
  async hasUserBookmarkedProject(userId: string, projectId: string) {
    const bookmark = await this.dbService.findOne({ userId, projectId });
    return !!bookmark;
  }
}

export default new BookmarkService();
