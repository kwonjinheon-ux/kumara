export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type StoredChatRoom = {
  id: string;
  postId: string | null;
  postTitle: string;
  buyerId: string;
  sellerId: string;
  isBuyerBlocked: boolean;
  isSellerBlocked: boolean;
  buyerLeftAt?: string | null;
  sellerLeftAt?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export type ChatParticipant = {
  id: string;
  nickname: string;
  email: string | null;
  profileImageUrl: string | null;
};

export type PublicChatMessage = ChatMessage & {
  isMine: boolean;
};

export type PublicChatRoom = {
  id: string;
  postId: string | null;
  postTitle: string;
  otherUser: ChatParticipant;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: PublicChatMessage[];
  createdAt: string;
  updatedAt: string;
};
