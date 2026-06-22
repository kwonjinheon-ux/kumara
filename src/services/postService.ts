import { postRepository } from "@/repositories/postRepository";

// Post service contains marketplace business actions used by ViewModels.
export const postService = {
  async deletePosts(postIds: string[]) {
    if (!postIds.length) return [];
    return postRepository.deleteMany(postIds);
  },

  async deleteBookmarks(userId: string, postIds: string[]) {
    if (!postIds.length) return [];
    await Promise.all(postIds.map((postId) => postRepository.removeBookmark(userId, postId)));
    return postIds;
  },
};
