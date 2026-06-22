export type ManagedCommentCategory =
  | "구인구직"
  | "마켓플레이스"
  | "부동산"
  | "생활정보"
  | "자유게시판";

export type ManagedUserComment = {
  id: string;
  userId: string;
  category: ManagedCommentCategory;
  body: string;
  sourceTitle: string;
  sourceHref: string | null;
  createdAt: string;
};
