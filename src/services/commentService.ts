import { commentRepository } from "@/repositories/commentRepository";

// Comment service is reserved for validation, nesting limits, and notification side effects.
export const commentService = {
  listByPost: commentRepository.listByPost,
  create: commentRepository.create,
  remove: commentRepository.remove,
};
