// cacheUtils.ts
import { redisClient, invalidateCache } from "../redis/redisClient";

// --------------------- Like Cache Keys ---------------------
export const getLikesKey = (projectId: string): string => {
  return `likes:${projectId}`;
};

export const getUserLikeStatusKey = (
  userId: string,
  projectId: string,
): string => {
  return `like:${userId}:${projectId}`;
};

export const getLikedProjectsKey = (userId: string): string => {
  return `likedProjects:${userId}`;
};

// --------------------- Bookmark Cache Keys ---------------------
export const getUserBookmarksKey = (userId: string): string => {
  return `bookmarks:${userId}`;
};

export const getBookmarkStatusKey = (
  userId: string,
  projectId: string,
): string => {
  return `bookmark:${userId}:${projectId}`;
};

// --------------------- Cache Invalidation Functions ---------------------
export const invalidateLikeCache = async (
  projectId: string,
  userId: string,
): Promise<void> => {
  await invalidateCache(getLikesKey(projectId));
  await invalidateCache(getUserLikeStatusKey(userId, projectId));
  await invalidateCache(getLikedProjectsKey(userId));
};

export const invalidateBookmarkCache = async (
  projectId: string,
  userId: string,
): Promise<void> => {
  await invalidateCache(getUserBookmarksKey(userId));
  await invalidateCache(getBookmarkStatusKey(userId, projectId));
};

// Optional: Invalidate both likes and bookmarks at once
export const invalidateProjectInteractionCache = async (
  projectId: string,
  userId: string,
): Promise<void> => {
  await invalidateLikeCache(projectId, userId);
  await invalidateBookmarkCache(projectId, userId);
};
