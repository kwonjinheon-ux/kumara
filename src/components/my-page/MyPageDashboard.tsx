"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/common/Button";
import { membershipLevels, type MembershipLevel } from "@/config/membershipLevels";
import type { PublicChatMessage, PublicChatRoom } from "@/types/chat";
import type { KeywordAlertSettings } from "@/types/keyword-alert";
import type { PublicMarketPost } from "@/types/marketplace";
import type { ManagedUserComment } from "@/types/user-comment";
import type { PublicUser } from "@/types/user";

type MyPageDashboardProps = {
  chatRooms: PublicChatRoom[];
  initialChatId?: string;
  initialTab?: Tab;
  keywordAlerts: KeywordAlertSettings;
  marketPosts: PublicMarketPost[];
  userComments: ManagedUserComment[];
  user: PublicUser;
};

const tabs = [
  "프로필 설정",
  "내가 쓴 게시글",
  "내가 쓴 댓글",
  "북마크",
  "1:1 채팅방",
  "키워드 알람 설정",
  "비밀번호 및 보안",
  "회원등급 / 포인트",
] as const;

type Tab = (typeof tabs)[number];

const myPageTabSlugs: Record<Tab, string> = {
  "프로필 설정": "profile",
  "내가 쓴 게시글": "posts",
  "내가 쓴 댓글": "comments",
  "북마크": "bookmarks",
  "1:1 채팅방": "chat",
  "키워드 알람 설정": "keywords",
  "비밀번호 및 보안": "security",
  "회원등급 / 포인트": "membership",
};

const myPageTabsBySlug = Object.fromEntries(
  Object.entries(myPageTabSlugs).map(([tab, slug]) => [slug, tab]),
) as Record<string, Tab>;

const tabIconNames: Record<Tab, IconName> = {
  "프로필 설정": "userGear",
  "내가 쓴 게시글": "fileLines",
  "내가 쓴 댓글": "comments",
  "북마크": "heart",
  "1:1 채팅방": "message",
  "키워드 알람 설정": "bell",
  "비밀번호 및 보안": "shield",
  "회원등급 / 포인트": "rankingStar",
};

const keywordBoards = ["마켓플레이스", "부동산", "구인구직", "자유게시판", "생활정보"] as const;
const defaultKeywordBoards = new Set(["마켓플레이스", "부동산", "구인구직"]);

const keywordLimitByLevel: Record<MembershipLevel, number> = {
  iron: 5,
  silver: 8,
  gold: 12,
  platinum: 20,
  diamond: 30,
  master: 50,
  master_plus: 100,
};

function normalizeKeywordBoardScopes(scopes: string[]) {
  const allowedBoards = new Set<string>(keywordBoards);
  const normalized = scopes.map((scope) => scope === "중고거래" ? "마켓플레이스" : scope);

  return Array.from(new Set(normalized)).filter((scope) => allowedBoards.has(scope));
}

const livingAreas = [
  "Auckland Central",
  "North Shore",
  "West Auckland",
  "East Auckland",
  "South Auckland",
  "Hamilton",
  "Tauranga",
  "Wellington",
  "Lower Hutt",
  "Christchurch",
  "Dunedin",
  "Palmerston North",
  "대한민국",
  "기타 지역",
] as const;

type LivingArea = (typeof livingAreas)[number];

const suburbOptions: Record<LivingArea, string[]> = {
  "Auckland Central": [
    "CBD",
    "Newmarket",
    "Mount Eden",
    "Ponsonby",
    "Parnell",
    "Epsom",
    "Mount Albert",
    "Grey Lynn",
  ],
  "North Shore": [
    "Takapuna",
    "Devonport",
    "Northcote",
    "Glenfield",
    "Birkenhead",
    "Albany",
    "Rosedale",
    "Browns Bay",
  ],
  "West Auckland": [
    "Henderson",
    "New Lynn",
    "Massey",
    "Te Atatu Peninsula",
    "Titirangi",
    "Glen Eden",
    "Westgate",
  ],
  "East Auckland": [
    "Howick",
    "Pakuranga",
    "Botany Downs",
    "Flat Bush",
    "Half Moon Bay",
    "Bucklands Beach",
  ],
  "South Auckland": [
    "Manukau",
    "Papatoetoe",
    "Mangere",
    "Otahuhu",
    "Takanini",
    "Papakura",
    "Pukekohe",
  ],
  Hamilton: [
    "Rototuna",
    "Flagstaff",
    "Chartwell",
    "Hillcrest",
    "Hamilton East",
    "Dinsdale",
    "Frankton",
    "Claudelands",
  ],
  Tauranga: [
    "Mount Maunganui",
    "Papamoa",
    "Bethlehem",
    "Otumoetai",
    "Greerton",
    "Tauranga Central",
    "Welcome Bay",
  ],
  Wellington: [
    "Te Aro",
    "Mount Victoria",
    "Kelburn",
    "Newtown",
    "Karori",
    "Johnsonville",
    "Miramar",
  ],
  "Lower Hutt": [
    "Petone",
    "Alicetown",
    "Woburn",
    "Waterloo",
    "Naenae",
    "Taita",
    "Eastbourne",
  ],
  Christchurch: [
    "Riccarton",
    "Papanui",
    "Hornby",
    "St Albans",
    "Addington",
    "Merivale",
    "Linwood",
    "Ilam",
  ],
  Dunedin: [
    "North Dunedin",
    "Central Dunedin",
    "Roslyn",
    "Mornington",
    "St Kilda",
    "Mosgiel",
    "South Dunedin",
  ],
  "Palmerston North": [
    "Hokowhitu",
    "Terrace End",
    "West End",
    "Highbury",
    "Milson",
    "Awapuni",
    "Kelvin Grove",
  ],
  대한민국: [
    "서울",
    "경기",
    "인천",
    "부산",
    "대구",
    "대전",
    "광주",
    "기타",
  ],
  "기타 지역": [
    "직접 입력 예정",
    "기타",
  ],
};

const levelMeta: Record<MembershipLevel, { emoji: string; points: number; tone: string }> = {
  iron: { emoji: "🌱", points: 0, tone: "첫 순환거래를 시작한 씨앗 단계" },
  silver: { emoji: "🌿", points: 300, tone: "재사용 습관이 자라나는 새싹 단계" },
  gold: { emoji: "🍃", points: 900, tone: "필요한 물건을 오래 쓰게 돕는 잎새 단계" },
  platinum: { emoji: "🌳", points: 1800, tone: "동네 순환거래를 키우는 나무 단계" },
  diamond: { emoji: "🌲", points: 3200, tone: "버려질 물건을 줄이는 숲 단계" },
  master: { emoji: "🌏", points: 5200, tone: "지속가능한 거래 문화를 이끄는 지구 단계" },
  master_plus: { emoji: "💚", points: 8000, tone: "가장 꾸준한 순환소비 리더" },
};

const benefitLabels = {
  none: "없음",
  limited: "일부",
  automatic: "자동",
  manual: "수동",
  single: "1회 예약",
  multiple: "여러 개",
  repeating: "자동 반복",
  basic: "기본",
  activity: "댓글/북마크",
  price_changes: "가격변동",
  personalized: "맞춤 추천",
  standard: "기본",
  reduced: "일부 제거",
  minimal: "거의 없음",
} as const;

export function MyPageDashboard({ chatRooms, initialChatId, initialTab, keywordAlerts, marketPosts, user, userComments }: MyPageDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(user);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? "프로필 설정");
  const [rooms, setRooms] = useState(chatRooms);
  const [selectedChatId, setSelectedChatId] = useState(
    initialChatId && chatRooms.some((chat) => chat.id === initialChatId)
      ? initialChatId
      : chatRooms[0]?.id ?? "",
  );
  const [isMobileChatLayout, setIsMobileChatLayout] = useState(false);
  const [newChatRecipient, setNewChatRecipient] = useState("");
  const [newChatSubject, setNewChatSubject] = useState("");
  const [newChatMessage, setNewChatMessage] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [profileImage, setProfileImage] = useState(currentUser.profile.profileImageUrl ?? "");
  const [imageScale, setImageScale] = useState(currentUser.profile.profileImageScale);
  const [imageX, setImageX] = useState(currentUser.profile.profileImageX);
  const [imageY, setImageY] = useState(currentUser.profile.profileImageY);
  const [savedMessage, setSavedMessage] = useState("");
  const [openImagePicker, setOpenImagePicker] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordMessage, setKeywordMessage] = useState("");
  const [keywords, setKeywords] = useState(keywordAlerts.keywords);
  const [selectedKeywordBoards, setSelectedKeywordBoards] = useState<string[]>(
    keywordAlerts.categoryScope.length
      ? normalizeKeywordBoardScopes(keywordAlerts.categoryScope)
      : Array.from(defaultKeywordBoards),
  );
  const [notifyInApp, setNotifyInApp] = useState(keywordAlerts.notifyInApp);
  const [notifyEmail, setNotifyEmail] = useState(keywordAlerts.notifyEmail);
  const [notifyPush, setNotifyPush] = useState(keywordAlerts.notifyPush);
  const [isMyMenuOpen, setIsMyMenuOpen] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesDesktopRef = useRef<HTMLDivElement>(null);
  const chatMessagesMobileRef = useRef<HTMLDivElement>(null);
  const chatInputDesktopRef = useRef<HTMLInputElement>(null);
  const chatInputMobileRef = useRef<HTMLInputElement>(null);
  const readingChatIdsRef = useRef<Set<string>>(new Set());
  const initials = useMemo(() => currentUser.nickname.slice(0, 2).toUpperCase(), [currentUser.nickname]);
  const initialArea = livingAreas.includes((currentUser.profile.city ?? currentUser.profile.tradeArea ?? "") as LivingArea)
    ? ((currentUser.profile.city ?? currentUser.profile.tradeArea) as LivingArea)
    : "";
  const [livingArea, setLivingArea] = useState<LivingArea | "">(initialArea);
  const [selectedSuburb, setSelectedSuburb] = useState(currentUser.profile.suburb ?? "");
  const areaSuburbs = livingArea ? suburbOptions[livingArea] : [];
  const currentPoints = 0;
  const currentLevelIndex = membershipLevels.findIndex((level) => level.level === currentUser.membershipLevel);
  const currentLevel = membershipLevels[Math.max(currentLevelIndex, 0)];
  const nextLevel = membershipLevels[currentLevelIndex + 1] ?? null;
  const currentLevelMeta = levelMeta[currentLevel.level];
  const nextLevelMeta = nextLevel ? levelMeta[nextLevel.level] : null;
  const currentLevelStart = currentLevelMeta.points;
  const nextLevelPoints = nextLevelMeta?.points ?? currentLevelStart;
  const pointsIntoLevel = Math.max(0, currentPoints - currentLevelStart);
  const pointsForNextLevel = Math.max(1, nextLevelPoints - currentLevelStart);
  const pointsRemaining = nextLevel ? Math.max(0, nextLevelPoints - currentPoints) : 0;
  const progressPercent = nextLevel
    ? Math.min(100, Math.round((pointsIntoLevel / pointsForNextLevel) * 100))
    : 100;
  const keywordLimit = keywordLimitByLevel[currentUser.membershipLevel];
  const keywordUsagePercent = Math.min(100, Math.round((keywords.length / Math.max(1, keywordLimit)) * 100));
  const remainingKeywordSlots = Math.max(0, keywordLimit - keywords.length);
  const selectedChat = rooms.find((chat) => chat.id === selectedChatId) ?? rooms[0] ?? null;
  const myMarketPosts = useMemo(
    () => marketPosts.filter((post) => post.isOwner),
    [marketPosts],
  );
  const bookmarkedMarketPosts = useMemo(
    () => marketPosts.filter((post) => post.isBookmarked),
    [marketPosts],
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialChatId && rooms.some((chat) => chat.id === initialChatId)) {
      setSelectedChatId(initialChatId);
    }
  }, [initialChatId, rooms]);

  useEffect(() => {
    const tabSlug = searchParams.get("tab");
    const nextTab = tabSlug ? myPageTabsBySlug[tabSlug] : undefined;

    if (nextTab) {
      setActiveTab(nextTab);
    }

    const chatId = searchParams.get("chatId");

    if (chatId && rooms.some((chat) => chat.id === chatId)) {
      setSelectedChatId(chatId);
    }
  }, [rooms, searchParams]);

  useEffect(() => {
    if (!openImagePicker || activeTab !== "프로필 설정") return;

    profileImageInputRef.current?.click();
    setOpenImagePicker(false);
  }, [activeTab, openImagePicker]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const syncLayout = () => setIsMobileChatLayout(mediaQuery.matches);

    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);

    return () => mediaQuery.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    if (!rooms.length) {
      setSelectedChatId("");
      return;
    }

    if (!selectedChatId || !rooms.some((room) => room.id === selectedChatId)) {
      setSelectedChatId(rooms[0].id);
    }
  }, [rooms, selectedChatId]);

  useEffect(() => {
    const messagePanel = isMobileChatLayout ? chatMessagesMobileRef.current : chatMessagesDesktopRef.current;

    if (!messagePanel) return;

    const frame = window.requestAnimationFrame(() => {
      messagePanel.scrollTop = messagePanel.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isMobileChatLayout, selectedChatId, selectedChat?.messages.length]);

  useEffect(() => {
    if (activeTab !== "1:1 채팅방" || !selectedChatId || !selectedChat?.unreadCount) return;

    void markChatAsRead(selectedChatId);
  }, [activeTab, selectedChatId, selectedChat?.unreadCount]);

  function onImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(typeof reader.result === "string" ? reader.result : "");
      setImageScale(1);
      setImageX(0);
      setImageY(0);
    };
    reader.readAsDataURL(file);
  }

  async function onProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      profileImageUrl: profileImage || null,
      profileImageScale: imageScale,
      profileImageX: imageX,
      profileImageY: imageY,
      nickname: String(formData.get("nickname") ?? ""),
      city: livingArea || null,
      suburb: selectedSuburb || null,
      kakaoTalkId: String(formData.get("kakaoTalkId") ?? ""),
      smartphoneNumber: String(formData.get("smartphoneNumber") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      allowChat: formData.get("allowChat") === "on",
      showKakaoTalkId: formData.get("showKakaoTalkId") === "on",
      showPhoneNumber: formData.get("showPhoneNumber") === "on",
      notificationComments: formData.get("notificationComments") === "on",
      notificationSavedPosts: formData.get("notificationSavedPosts") === "on",
      notificationTradeMessages: formData.get("notificationTradeMessages") === "on",
    };

    const response = await fetch("/api/my-page/profile", {
      body: JSON.stringify(payload),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    const result = await response.json().catch(() => null) as { error?: string; user?: PublicUser } | null;

    if (!response.ok) {
      setSavedMessage(result?.error ?? "프로필 저장에 실패했습니다.");
      return;
    }

    if (result?.user) {
      setCurrentUser(result.user);
      setProfileImage(result.user.profile.profileImageUrl ?? "");
      setImageScale(result.user.profile.profileImageScale);
      setImageX(result.user.profile.profileImageX);
      setImageY(result.user.profile.profileImageY);
      setLivingArea(
        livingAreas.includes((result.user.profile.city ?? result.user.profile.tradeArea ?? "") as LivingArea)
          ? ((result.user.profile.city ?? result.user.profile.tradeArea) as LivingArea)
          : "",
      );
      setSelectedSuburb(result.user.profile.suburb ?? "");
    }

    setSavedMessage("프로필 설정이 DB에 저장되었습니다.");
    router.refresh();
  }

  async function createChat(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChatMessage("");

    const response = await fetch("/api/my-page/chats", {
      body: JSON.stringify({
        recipient: newChatRecipient,
        postTitle: newChatSubject || "일반 문의",
        message: newChatMessage,
      }),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = await response.json().catch(() => null) as { chats?: PublicChatRoom[]; error?: string } | null;

    if (!response.ok || !result?.chats) {
      setChatMessage(result?.error ?? "채팅방을 만들 수 없습니다.");
      return;
    }

    setRooms(result.chats);
    setSelectedChatId(result.chats[0]?.id ?? "");
    setNewChatRecipient("");
    setNewChatSubject("");
    setNewChatMessage("");
    setChatMessage("채팅방이 준비되었습니다.");
  }

  function replaceChatRoom(nextChat: PublicChatRoom) {
    setRooms((currentRooms) => {
      const hasChat = currentRooms.some((room) => room.id === nextChat.id);

      if (!hasChat) return [nextChat, ...currentRooms];

      return currentRooms.map((room) => room.id === nextChat.id ? nextChat : room);
    });
  }

  async function sendChatMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageText = chatDraft.trim();

    if (!selectedChat || !messageText || isSendingChat) {
      focusChatInput();
      return;
    }

    const createdAt = new Date().toISOString();
    const optimisticMessage: PublicChatMessage = {
      chatId: selectedChat.id,
      createdAt,
      id: `optimistic-${createdAt}-${messageText.length}`,
      isMine: true,
      isRead: true,
      message: messageText,
      senderId: currentUser.id,
    };
    const optimisticChat: PublicChatRoom = {
      ...selectedChat,
      lastMessage: messageText,
      lastMessageAt: createdAt,
      messages: [...selectedChat.messages, optimisticMessage],
      unreadCount: 0,
      updatedAt: createdAt,
    };

    replaceChatRoom(optimisticChat);
    setSelectedChatId(selectedChat.id);
    setChatDraft("");
    setChatMessage("");
    setIsSendingChat(true);

    try {
      const response = await fetch(`/api/my-page/chats/${selectedChat.id}/messages`, {
        body: JSON.stringify({ message: messageText }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await response.json().catch(() => null) as {
        chat?: PublicChatRoom;
        chats?: PublicChatRoom[];
        error?: string;
      } | null;

      if (!response.ok || (!result?.chat && !result?.chats)) {
        replaceChatRoom(selectedChat);
        setChatDraft(messageText);
        setChatMessage(result?.error ?? "메시지를 보낼 수 없습니다.");
        return;
      }

      if (result.chat) {
        replaceChatRoom(result.chat);
      } else if (result.chats) {
        setRooms(result.chats);
      }
    } finally {
      setIsSendingChat(false);
      focusChatInput();
    }
  }

  function focusChatInput() {
    window.requestAnimationFrame(() => {
      const input = isMobileChatLayout ? chatInputMobileRef.current : chatInputDesktopRef.current;
      input?.focus();
    });
  }

  async function markChatAsRead(chatId: string) {
    const chat = rooms.find((room) => room.id === chatId);

    if (!chat?.unreadCount || readingChatIdsRef.current.has(chatId)) return;

    readingChatIdsRef.current.add(chatId);
    setRooms((currentRooms) =>
      currentRooms.map((room) =>
        room.id === chatId
          ? {
              ...room,
              unreadCount: 0,
              messages: room.messages.map((message) =>
                message.isMine || message.isRead ? message : { ...message, isRead: true },
              ),
            }
          : room,
      ),
    );

    try {
      const response = await fetch(`/api/my-page/chats/${chatId}/messages`, {
        credentials: "same-origin",
        method: "PATCH",
      });
      const result = await response.json().catch(() => null) as {
        chat?: PublicChatRoom;
        chats?: PublicChatRoom[];
        error?: string;
      } | null;

      if (response.ok && result?.chat) {
        replaceChatRoom(result.chat);
      } else if (response.ok && result?.chats) {
        setRooms(result.chats);
      }
    } finally {
      readingChatIdsRef.current.delete(chatId);
    }
  }

  function openChat(chatId: string) {
    setSelectedChatId(chatId);
    window.history.replaceState(null, "", `/my-page?tab=chat&chatId=${chatId}`);
    void markChatAsRead(chatId);
  }

  async function leaveSelectedChat() {
    if (!selectedChat) return;

    const confirmed = window.confirm("이 채팅방을 나가시겠습니까? 채팅 목록에서 사라집니다.");

    if (!confirmed) return;

    setChatMessage("");
    const response = await fetch(`/api/my-page/chats/${selectedChat.id}`, {
      credentials: "same-origin",
      method: "DELETE",
    });
    const result = await response.json().catch(() => null) as { chats?: PublicChatRoom[]; error?: string } | null;

    if (!response.ok || !result?.chats) {
      setChatMessage(result?.error ?? "채팅방을 나갈 수 없습니다.");
      return;
    }

    setRooms(result.chats);
    setSelectedChatId(result.chats[0]?.id ?? "");
    setChatDraft("");
    setChatMessage("채팅방에서 나갔습니다.");
  }

  function renderChatPanel(panelChat: PublicChatRoom | null, variant: "desktop" | "mobile") {
    return (
      <section className={`chat-panel chat-panel--${variant}`} aria-label="채팅 내용">
        {panelChat ? (
          <>
            <div className="chat-panel-header">
              <ChatAvatar nickname={panelChat.otherUser.nickname} profileImageUrl={panelChat.otherUser.profileImageUrl} />
              <div>
                <strong>{panelChat.otherUser.nickname}</strong>
                <span>{panelChat.postTitle}</span>
              </div>
              <button className="chat-leave-button" onClick={leaveSelectedChat} type="button">
                나가기
              </button>
            </div>
            <div
              className="chat-messages"
              ref={variant === "desktop" ? chatMessagesDesktopRef : chatMessagesMobileRef}
            >
              {panelChat.messages.length ? (
                panelChat.messages.map((message, index) => {
                  const previousMessage = panelChat.messages[index - 1];
                  const showDateDivider = shouldShowChatDateDivider(message.createdAt, previousMessage?.createdAt);

                  return (
                    <Fragment key={message.id}>
                      {showDateDivider ? (
                        <div className="chat-date-divider">
                          <span>{formatChatDate(message.createdAt)}</span>
                        </div>
                      ) : null}
                      <div className={message.isMine ? "chat-bubble mine" : "chat-bubble"}>
                        <p>{message.message}</p>
                        <span>{formatChatTime(message.createdAt)}</span>
                      </div>
                    </Fragment>
                  );
                })
              ) : (
                <div className="chat-empty">첫 메시지를 보내 대화를 시작하세요.</div>
              )}
            </div>
            <form className="chat-compose" onSubmit={sendChatMessage}>
              <input
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="메시지를 입력하세요"
                ref={variant === "desktop" ? chatInputDesktopRef : chatInputMobileRef}
                value={chatDraft}
              />
              <Button disabled={isSendingChat || !chatDraft.trim()} type="submit">보내기</Button>
            </form>
          </>
        ) : (
          <div className="chat-empty">왼쪽에서 채팅방을 선택하거나 새 채팅을 시작하세요.</div>
        )}
      </section>
    );
  }

  function addKeyword(rawKeyword: string) {
    const keyword = rawKeyword.trim().replace(/\s+/g, " ");

    if (!keyword) {
      setKeywordMessage("빈 키워드는 등록할 수 없습니다.");
      return;
    }

    if (keyword.length < 2) {
      setKeywordMessage("키워드는 2글자 이상 입력해주세요.");
      return;
    }

    if (keywords.some((savedKeyword) => savedKeyword.toLowerCase() === keyword.toLowerCase())) {
      setKeywordMessage("이미 등록된 키워드입니다.");
      return;
    }

    if (keywords.length >= keywordLimit) {
      setKeywordMessage(`현재 등급에서는 최대 ${keywordLimit}개까지 등록할 수 있습니다.`);
      return;
    }

    setKeywords((currentKeywords) => [...currentKeywords, keyword]);
    setKeywordInput("");
    setKeywordMessage("키워드가 등록되었습니다.");
  }

  function onKeywordInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    addKeyword(keywordInput);
  }

  function removeKeyword(keyword: string) {
    setKeywords((currentKeywords) => currentKeywords.filter((savedKeyword) => savedKeyword !== keyword));
    setKeywordMessage("키워드가 삭제되었습니다.");
  }

  function clearKeywords() {
    setKeywords([]);
    setKeywordMessage("등록된 키워드를 모두 삭제했습니다.");
  }

  function toggleKeywordBoard(board: string) {
    setSelectedKeywordBoards((currentBoards) =>
      currentBoards.includes(board)
        ? currentBoards.filter((currentBoard) => currentBoard !== board)
        : [...currentBoards, board],
    );
  }

  async function saveKeywordAlerts() {
    setKeywordMessage("");

    const response = await fetch("/api/my-page/keyword-alerts", {
      body: JSON.stringify({
        keywords,
        categoryScope: selectedKeywordBoards,
        notifyInApp,
        notifyEmail,
        notifyPush,
        isActive: true,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    const result = await response.json().catch(() => null) as {
      error?: string;
      settings?: KeywordAlertSettings;
    } | null;

    if (!response.ok || !result?.settings) {
      setKeywordMessage(result?.error ?? "키워드 알람 저장에 실패했습니다.");
      return;
    }

    setKeywords(result.settings.keywords);
    setSelectedKeywordBoards(normalizeKeywordBoardScopes(result.settings.categoryScope));
    setNotifyInApp(result.settings.notifyInApp);
    setNotifyEmail(result.settings.notifyEmail);
    setNotifyPush(result.settings.notifyPush);
    setKeywordMessage("키워드 알람 설정이 DB에 저장되었습니다.");
  }

  function openProfileImageEditor() {
    selectMyPageTab("프로필 설정");
    setOpenImagePicker(true);
  }

  function selectMyPageTab(tab: Tab) {
    setActiveTab(tab);
    setIsMyMenuOpen(false);

    const slug = myPageTabSlugs[tab];
    const query = tab === "1:1 채팅방" && selectedChatId
      ? `?tab=${slug}&chatId=${selectedChatId}`
      : `?tab=${slug}`;
    window.history.replaceState(null, "", `/my-page${query}`);
  }

  function onLivingAreaChange(area: LivingArea | "") {
    setLivingArea(area);
    setSelectedSuburb("");
  }

  return (
    <section className="my-page-shell">
      <button
        aria-expanded={isMyMenuOpen}
        className={isMyMenuOpen ? "my-page-sidebar-toggle open" : "my-page-sidebar-toggle"}
        onClick={() => setIsMyMenuOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="sr-only">내 페이지 메뉴</span>
      </button>
      <aside className={isMyMenuOpen ? "my-page-sidebar open" : "my-page-sidebar"}>
        <div className="my-profile-card">
          <button
            aria-label="프로필 사진 변경"
            className="my-avatar my-avatar-button"
            onClick={openProfileImageEditor}
            title="프로필 사진 변경"
            type="button"
          >
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${currentUser.nickname} 프로필`}
                src={profileImage}
                style={{
                  transform: `translate(${imageX}px, ${imageY}px) scale(${imageScale})`,
                }}
              />
            ) : (
              <span>{initials}</span>
            )}
            <span className="avatar-edit-badge">변경</span>
          </button>
          <strong>{currentUser.nickname}</strong>
          <span>{currentLevelMeta.emoji} {currentLevel.label} · {currentUser.isEmailVerified ? "이메일 인증됨" : "인증 필요"}</span>
        </div>
        <nav className="my-page-nav" aria-label="내 페이지 메뉴">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab ? "active" : ""}
              key={tab}
              onClick={() => selectMyPageTab(tab)}
              type="button"
            >
              <MenuIcon active={activeTab === tab} name={tabIconNames[tab]} />
              <span>{tab}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="my-page-main">
        {activeTab === "프로필 설정" ? (
          <form className="my-section" onSubmit={onProfileSave}>
            <SectionTitle title="프로필 설정" description="가입 때 입력하지 않은 정보를 나중에 채워 신뢰도를 높입니다." />
            <div className="profile-editor">
              <div className="profile-editor-preview">
                <div className="my-avatar large">
                  {profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="프로필 미리보기"
                      src={profileImage}
                      style={{
                        transform: `translate(${imageX}px, ${imageY}px) scale(${imageScale})`,
                      }}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <label className="file-button">
                  이미지 변경
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    onChange={onImageChange}
                    ref={profileImageInputRef}
                    type="file"
                  />
                </label>
              </div>
              <div className="profile-controls">
                <ControlSlider label="크기 조절" max="1.8" min="0.8" onChange={setImageScale} step="0.05" value={imageScale} />
                <ControlSlider label="가로 위치" max="24" min="-24" onChange={setImageX} step="1" value={imageX} />
                <ControlSlider label="세로 위치" max="24" min="-24" onChange={setImageY} step="1" value={imageY} />
              </div>
            </div>
            <div className="my-form-grid">
              <label>아이디(이메일)<input name="email" readOnly value={currentUser.email ?? ""} /></label>
              <label>닉네임<input defaultValue={currentUser.nickname} name="nickname" /></label>
              <label>
                사는 지역
                <select
                  name="city"
                  onChange={(event) => onLivingAreaChange(event.target.value as LivingArea | "")}
                  value={livingArea}
                >
                  <option value="">지역 선택</option>
                  {livingAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </label>
              <label>
                세부 지역
                <select
                  disabled={!livingArea}
                  name="suburb"
                  onChange={(event) => setSelectedSuburb(event.target.value)}
                  value={selectedSuburb}
                >
                  <option value="">{livingArea ? "세부 지역 선택" : "먼저 사는 지역 선택"}</option>
                  {areaSuburbs.map((suburb) => (
                    <option key={suburb} value={suburb}>{suburb}</option>
                  ))}
                </select>
              </label>
              <label>카카오톡 ID<input defaultValue={currentUser.profile.kakaoTalkId ?? ""} name="kakaoTalkId" /></label>
              <label>전화번호<input defaultValue={currentUser.profile.smartphoneNumber ?? ""} name="smartphoneNumber" /></label>
              <label className="span-2">자기소개<textarea defaultValue={currentUser.profile.bio ?? ""} name="bio" rows={3} /></label>
            </div>
            <div className="my-check-grid">
              <label><input defaultChecked={currentUser.profile.allowChat} name="allowChat" type="checkbox" /> KumaraMarket.nz 1:1 채팅 허용</label>
              <label><input defaultChecked={currentUser.profile.showKakaoTalkId} name="showKakaoTalkId" type="checkbox" /> 카카오톡 ID 공개</label>
              <label><input defaultChecked={currentUser.profile.showPhoneNumber} name="showPhoneNumber" type="checkbox" /> 전화번호 공개</label>
              <label><input defaultChecked={currentUser.profile.notificationComments} name="notificationComments" type="checkbox" /> 댓글 알림</label>
              <label><input defaultChecked={currentUser.profile.notificationSavedPosts} name="notificationSavedPosts" type="checkbox" /> 북마크 알림</label>
              <label><input defaultChecked={currentUser.profile.notificationTradeMessages} name="notificationTradeMessages" type="checkbox" /> 거래 문의 알림</label>
            </div>
            {savedMessage ? <p className="form-success">{savedMessage}</p> : null}
            <Button type="submit">저장하기</Button>
          </form>
        ) : null}

        {activeTab === "내가 쓴 게시글" ? (
          <PostManagementSection initialPosts={myMarketPosts} />
        ) : null}

        {activeTab === "내가 쓴 댓글" ? (
          <CommentManagementSection initialComments={userComments} />
        ) : null}

        {activeTab === "북마크" ? (
          <BookmarkManagementSection initialPosts={bookmarkedMarketPosts} />
        ) : null}

        {activeTab === "1:1 채팅방" ? (
          <div className="my-section">
            <SectionTitle title="1:1 채팅방" description="게시글 기반 채팅과 읽지 않은 메시지를 확인합니다." />
            <div className="chat-workspace">
              <aside className="chat-list" aria-label="채팅방 목록">
                {rooms.length ? (
                  rooms.map((chat) => (
                      <button
                        key={chat.id}
                        className={selectedChat?.id === chat.id ? "chat-row active" : "chat-row"}
                        onClick={() => openChat(chat.id)}
                        type="button"
                      >
                        <ChatAvatar nickname={chat.otherUser.nickname} profileImageUrl={chat.otherUser.profileImageUrl} />
                        <div className="chat-row__content">
                          <div className="chat-row__title">
                            <strong>{chat.otherUser.nickname}</strong>
                            <span>{chat.postTitle}</span>
                          </div>
                          <p>{chat.lastMessage}</p>
                        </div>
                        <div className="chat-meta">
                          <span>{formatRelativeTime(chat.lastMessageAt)}</span>
                          {chat.unreadCount ? <b>{chat.unreadCount}</b> : null}
                        </div>
                      </button>
                  ))
                ) : (
                  <div className="chat-empty">아직 열린 채팅방이 없습니다.</div>
                )}
              </aside>

              {!isMobileChatLayout ? renderChatPanel(selectedChat, "desktop") : null}
              {isMobileChatLayout ? renderChatPanel(selectedChat, "mobile") : null}
            </div>

            <form className="chat-start-form" onSubmit={createChat}>
              <SectionTitle title="새 채팅 시작" description="상대방 이메일 또는 닉네임으로 1:1 채팅방을 엽니다." />
              <div className="my-form-grid">
                <label>
                  상대방 이메일 / 닉네임
                  <input
                    onChange={(event) => setNewChatRecipient(event.target.value)}
                    placeholder="예: user@example.com 또는 닉네임"
                    value={newChatRecipient}
                  />
                </label>
                <label>
                  문의 제목
                  <input
                    onChange={(event) => setNewChatSubject(event.target.value)}
                    placeholder="예: IKEA 책상 문의"
                    value={newChatSubject}
                  />
                </label>
                <label className="span-2">
                  첫 메시지
                  <textarea
                    onChange={(event) => setNewChatMessage(event.target.value)}
                    placeholder="처음 보낼 메시지를 입력하세요"
                    rows={3}
                    value={newChatMessage}
                  />
                </label>
              </div>
              {chatMessage ? <p className={chatMessage.includes("되었습니다") ? "form-success" : "form-error"}>{chatMessage}</p> : null}
              <Button type="submit">채팅방 만들기</Button>
            </form>
            </div>
        ) : null}

        {activeTab === "키워드 알람 설정" ? (
          <div className="my-section">
            <SectionTitle
              title="키워드 알람 설정"
              description="관심 키워드를 등록하면 해당 단어가 포함된 새 게시물이 올라올 때 알려드립니다."
            />
            <div className="keyword-panel">
              <div className="keyword-stats" aria-label="키워드 등록 현황">
                <span>
                  현재 등급
                  <strong className="keyword-level-name">
                    <span aria-hidden="true">{currentLevelMeta.emoji}</span>
                    {currentLevel.label}
                  </strong>
                </span>
                <div className="keyword-usage-card">
                  <div className="keyword-usage-card__header">
                    <span>키워드 등록 현황</span>
                    <strong>{keywords.length} / {keywordLimit}</strong>
                  </div>
                  <div
                    aria-label={`키워드 ${keywordLimit}개 중 ${keywords.length}개 등록`}
                    aria-valuemax={keywordLimit}
                    aria-valuemin={0}
                    aria-valuenow={keywords.length}
                    className="keyword-usage-progress"
                    role="progressbar"
                  >
                    <span style={{ width: `${keywordUsagePercent}%` }} />
                  </div>
                  <p>등록 가능 {remainingKeywordSlots}개 남음</p>
                </div>
              </div>
              <label className="keyword-input-label">
                키워드 입력
                <input
                  className="keyword-input"
                  onChange={(event) => setKeywordInput(event.target.value)}
                  onKeyDown={onKeywordInputKeyDown}
                  placeholder="키워드를 입력하고 Enter를 누르세요"
                  type="text"
                  value={keywordInput}
                />
              </label>
              {keywordMessage ? <p className="form-success compact">{keywordMessage}</p> : null}
              <div className="keyword-tags-wrap">
                <div className="keyword-tags-title">
                  <strong>등록된 키워드</strong>
                  <span>{keywords.length} / {keywordLimit}</span>
                </div>
                {keywords.length ? (
                  <div className="keyword-tags">
                    {keywords.map((keyword) => (
                      <span className="keyword-tag" key={keyword}>
                        {keyword}
                        <button
                          aria-label={`${keyword} 키워드 삭제`}
                          onClick={() => removeKeyword(keyword)}
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">등록된 키워드가 없습니다.</p>
                )}
              </div>
              <div className="keyword-settings-grid">
                <fieldset>
                  <legend>알림 받을 게시판</legend>
                  {keywordBoards.map((board) => (
                    <label key={board}>
                      <input
                        checked={selectedKeywordBoards.includes(board)}
                        onChange={() => toggleKeywordBoard(board)}
                        type="checkbox"
                      />
                      {board}
                    </label>
                  ))}
                </fieldset>
                <fieldset>
                  <legend>알림 방식</legend>
                  <label>
                    <input
                      checked={notifyInApp}
                      onChange={(event) => setNotifyInApp(event.target.checked)}
                      type="checkbox"
                    />
                    사이트 알림
                  </label>
                  <label>
                    <input
                      checked={notifyEmail}
                      onChange={(event) => setNotifyEmail(event.target.checked)}
                      type="checkbox"
                    />
                    이메일 알림
                  </label>
                  <label className="disabled">
                    <input
                      checked={notifyPush}
                      disabled
                      onChange={(event) => setNotifyPush(event.target.checked)}
                      type="checkbox"
                    />
                    앱 푸시 알림
                  </label>
                </fieldset>
              </div>
              <div className="keyword-actions">
                <Button onClick={clearKeywords} type="button" variant="muted">전체 삭제</Button>
                <Button onClick={saveKeywordAlerts} type="button">
                  저장
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "비밀번호 및 보안" ? (
          <div className="my-section">
            <SectionTitle title="비밀번호 및 보안" description="비밀번호 변경, 이메일 인증, 2단계 인증을 관리합니다." />
            <div className="security-grid">
              <Link className="security-action" href="/auth/reset-password">비밀번호 재설정</Link>
              <button className="security-action" type="button">이메일 인증 상태: {currentUser.isEmailVerified ? "완료" : "필요"}</button>
              <button className="security-action" type="button">2단계 인증 준비 중</button>
              <form action="/api/auth/logout" method="post">
                <button className="security-action danger" type="submit">모든 기기에서 로그아웃</button>
              </form>
            </div>
          </div>
        ) : null}

        {activeTab === "회원등급 / 포인트" ? (
          <div className="my-section">
            <SectionTitle title="에코 멤버십 / 그린 포인트" description="중고를 사고파는 활동을 순환소비와 자연환경 기여로 기록합니다." />
            <div className="level-panel">
              <div className="level-panel__summary">
                <div>
                  <span className="level-emoji" aria-hidden="true">{currentLevelMeta.emoji}</span>
                  <strong>{currentLevel.label}</strong>
                  <p>{currentLevelMeta.tone}</p>
                </div>
                <b>{currentPoints.toLocaleString()} 그린P</b>
              </div>
              <div className="level-progress">
                <div className="level-progress__header">
                  <span>
                    {nextLevel ? `다음 에코 등급: ${levelMeta[nextLevel.level].emoji} ${nextLevel.label}` : "최고 에코 등급입니다"}
                  </span>
                  <strong>
                    {nextLevel ? `${pointsRemaining.toLocaleString()} 그린P 남음` : "완료"}
                  </strong>
                </div>
                <div className="level-progress__bar" aria-label="다음 에코 등급 진행률">
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
                <p>
                  {nextLevel
                    ? `${currentPoints.toLocaleString()} 그린P / ${nextLevelPoints.toLocaleString()} 그린P`
                    : "모든 순환 혜택이 열려 있습니다."}
                </p>
              </div>
            </div>
            <div className="level-table-wrap">
              <table className="level-benefits-table">
                <thead>
                  <tr>
                    <th>에코 등급</th>
                    <th>필요 그린 포인트</th>
                    <th>순환 보관함</th>
                    <th>재사용 알림</th>
                    <th>친환경 혜택</th>
                    <th>화면 환경</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipLevels.map((level) => {
                    const meta = levelMeta[level.level];
                    const benefits = level.benefits;
                    const isCurrent = level.level === currentLevel.level;
                    const savedLimit = benefits.savedPostLimit === null ? "무제한" : `${benefits.savedPostLimit}개`;
                    const coreBenefits = [
                      benefits.savedPostFolders ? "관심 물건 분류함" : "",
                      benefits.priceChangeAlerts !== "none"
                        ? `재사용 기회 알림 ${benefitLabels[benefits.priceChangeAlerts]}`
                        : "",
                      benefits.savedSearchFilters ? "순환 검색 저장" : "",
                      benefits.bulkPostManagement ? "나눔/판매글 일괄 관리" : "",
                      benefits.sellerAnalytics ? "내 순환거래 리포트" : "",
                      benefits.personalizedRecommendations ? "친환경 맞춤 추천" : "",
                    ].filter(Boolean);

                    return (
                      <tr className={isCurrent ? "current" : ""} key={level.level}>
                        <td data-label="에코 등급">
                          <span className="level-name">
                            <span aria-hidden="true">{meta.emoji}</span>
                            {level.label}
                            {isCurrent ? <em>현재</em> : null}
                          </span>
                        </td>
                        <td data-label="필요 그린 포인트">{meta.points.toLocaleString()} 그린P</td>
                        <td data-label="순환 보관함">{savedLimit}</td>
                        <td data-label="재사용 알림">{keywordLimitByLevel[level.level]}개</td>
                        <td data-label="친환경 혜택">
                          {coreBenefits.length ? coreBenefits.join(" · ") : "기본 순환거래 기능"}
                        </td>
                        <td data-label="화면 환경">{benefitLabels[benefits.adExperience]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

type IconName =
  | "userGear"
  | "fileLines"
  | "comments"
  | "heart"
  | "message"
  | "bell"
  | "shield"
  | "rankingStar";

function MenuIcon({ active, name }: { active?: boolean; name: IconName }) {
  const commonProps = {
    "aria-hidden": true,
    className: "menu-icon",
    fill: "none",
    focusable: false,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  const solidProps = {
    "aria-hidden": true,
    className: "menu-icon menu-icon--solid",
    fill: "currentColor",
    focusable: false,
    stroke: "none",
    viewBox: "0 0 24 24",
  };

  if (active) {
    if (name === "userGear") {
      return (
        <svg {...solidProps}>
          <path d="M8.8 11.1a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2ZM2.6 20.4c.7-4 3.1-6.1 6.2-6.1 1.4 0 2.7.4 3.7 1.1a5.8 5.8 0 0 0-.5 2.4c0 .9.2 1.8.6 2.6H2.6Z" />
          <path d="M18.5 13.1c.2.1.3.4.3.6l-.1.7c.3.2.5.3.7.6l.7-.2c.2-.1.5 0 .7.2l.7 1.2c.1.2.1.5-.1.7l-.5.5v.8l.5.5c.2.2.2.5.1.7l-.7 1.2c-.2.2-.5.3-.7.2l-.7-.2c-.2.2-.5.4-.7.6l.1.7c0 .2-.1.5-.3.6h-1.4c-.2-.1-.3-.4-.3-.6l.1-.7c-.3-.2-.5-.3-.7-.6l-.7.2c-.2.1-.5 0-.7-.2l-.7-1.2c-.1-.2-.1-.5.1-.7l.5-.5v-.8l-.5-.5c-.2-.2-.2-.5-.1-.7l.7-1.2c.2-.2.5-.3.7-.2l.7.2c.2-.2.5-.4.7-.6l-.1-.7c0-.2.1-.5.3-.6h1.4Zm-.7 5.9a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z" />
        </svg>
      );
    }

    if (name === "fileLines") {
      return (
        <svg {...solidProps}>
          <path d="M6.5 2.8h7.2L19 8.1v11.4c0 1-.8 1.7-1.7 1.7H6.5c-1 0-1.8-.8-1.8-1.7V4.6c0-1 .8-1.8 1.8-1.8Zm6.5 1.5v4.5h4.5L13 4.3Z" />
          <path d="M8 12.3h8v1.6H8v-1.6Zm0 4h8v1.6H8v-1.6Z" fill="#fff" opacity=".85" />
        </svg>
      );
    }

    if (name === "comments") {
      return (
        <svg {...solidProps}>
          <path d="M7.1 3.1h7.2c2.5 0 4.5 1.9 4.5 4.3v2.9c0 2.4-2 4.3-4.5 4.3H9.5l-5.2 3.1c-.5.3-1.1 0-1.1-.6V7.4c0-2.4 2-4.3 3.9-4.3Z" />
          <path d="M18.8 8.5h.5c1.4 0 2.6 1.2 2.6 2.7v2.5c0 1.5-1.2 2.7-2.6 2.7h-2.5l-3.3 2c-.4.2-.9 0-.9-.5v-1.7h1.7c3 0 5.4-2.4 5.4-5.2V8.7c-.3-.1-.6-.2-.9-.2Z" opacity=".78" />
        </svg>
      );
    }

    if (name === "heart") {
      return (
        <svg {...solidProps}>
          <path d="M12 21.1 10.7 20C5.3 15.4 2.5 12.9 2.5 8.9A4.6 4.6 0 0 1 7.1 4.2c2 0 3.7 1 4.9 2.6a5.8 5.8 0 0 1 4.9-2.6 4.6 4.6 0 0 1 4.6 4.7c0 4-2.8 6.5-8.2 11.1L12 21.1Z" />
        </svg>
      );
    }

    if (name === "message") {
      return (
        <svg {...solidProps}>
          <path d="M4.9 4.2h14.2c1.2 0 2.2 1 2.2 2.2v8.4c0 1.2-1 2.2-2.2 2.2H9.5l-5.1 4.2c-.5.4-1.2 0-1.2-.6V6.4c0-1.2 1-2.2 1.7-2.2Z" />
          <path d="M7.2 8.4h9.6V10H7.2V8.4Zm0 4h6.6V14H7.2v-1.6Z" fill="#fff" opacity=".86" />
        </svg>
      );
    }

    if (name === "bell") {
      return (
        <svg {...solidProps}>
          <path d="M12 2.2a1.4 1.4 0 0 1 1.4 1.4v.6a6.5 6.5 0 0 1 5.1 6.3v2.9l2.1 3.8c.3.6-.1 1.3-.8 1.3H4.2c-.7 0-1.1-.7-.8-1.3l2.1-3.8v-2.9a6.5 6.5 0 0 1 5.1-6.3v-.6A1.4 1.4 0 0 1 12 2.2ZM9.4 19.8h5.2a2.6 2.6 0 0 1-5.2 0Z" />
        </svg>
      );
    }

    if (name === "shield") {
      return (
        <svg {...solidProps}>
          <path d="M12 2.6 19.5 5v6.8c0 6.8-5.5 9.7-7.5 10.5-2-.8-7.5-3.7-7.5-10.5V5L12 2.6Z" />
          <path d="m9.1 12.2 2 2 4-4.6 1.3 1.1-5.2 6-3.4-3.4 1.3-1.1Z" fill="#fff" opacity=".9" />
        </svg>
      );
    }

    return (
      <svg {...solidProps}>
        <path d="m12 2.7 2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9L12 2.7Z" />
        <path d="M4.2 21h15.6v1.5H4.2V21Z" />
      </svg>
    );
  }

  if (name === "userGear") {
    return (
      <svg {...commonProps}>
        <path d="M8.8 10.4a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z" />
        <path d="M2.8 19.5c.8-3.3 3-5 6-5 1.2 0 2.3.3 3.2.8" />
        <path d="M17.5 20.8a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" />
        <path d="M17.5 13v1.2M17.5 20.8V22M13.6 17.5h1.2M20.2 17.5h1.2M14.7 14.7l.8.8M19.5 19.5l.8.8M14.7 20.3l.8-.8M19.5 15.5l.8-.8" />
      </svg>
    );
  }

  if (name === "fileLines") {
    return (
      <svg {...commonProps}>
        <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5M8.5 12h7M8.5 16h7" />
      </svg>
    );
  }

  if (name === "comments") {
    return (
      <svg {...commonProps}>
        <path d="M4 5.8A3.8 3.8 0 0 1 7.8 2h6.4A3.8 3.8 0 0 1 18 5.8v3.4a3.8 3.8 0 0 1-3.8 3.8H9l-5 3v-5.1A3.8 3.8 0 0 1 4 9.2Z" />
        <path d="M18 8.4h.2A2.8 2.8 0 0 1 21 11.2v2.4a2.8 2.8 0 0 1-2.8 2.8H16l-3 2v-2" />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg {...commonProps}>
        <path d="M12 20.5S4.5 16.1 3.2 10.6C2.4 7.2 4.6 4.5 7.5 4.5c1.8 0 3.3 1 4.5 2.5 1.2-1.5 2.7-2.5 4.5-2.5 2.9 0 5.1 2.7 4.3 6.1C19.5 16.1 12 20.5 12 20.5Z" />
      </svg>
    );
  }

  if (name === "message") {
    return (
      <svg {...commonProps}>
        <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        <path d="M7.5 9.5h9M7.5 13h5.5" />
      </svg>
    );
  }

  if (name === "bell") {
    return (
      <svg {...commonProps}>
        <path d="M18 9.8a6 6 0 0 0-12 0c0 7-2.3 7.5-2.3 7.5h16.6S18 16.8 18 9.8Z" />
        <path d="M9.8 20a2.4 2.4 0 0 0 4.4 0" />
        <path d="M12 2v1.5" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...commonProps}>
        <path d="M12 22s7-3.2 7-10V5.5L12 3 5 5.5V12c0 6.8 7 10 7 10Z" />
        <path d="M9 12.3 11 14l4-4.5" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 3Z" />
      <path d="M4 21h16" />
    </svg>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function ChatAvatar({ nickname, profileImageUrl }: { nickname: string; profileImageUrl: string | null }) {
  return (
    <div className="chat-avatar">
      {profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={`${nickname} 프로필`} src={profileImageUrl} />
      ) : (
        <span>{nickname.slice(0, 2)}</span>
      )}
    </div>
  );
}

function ControlSlider({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: string;
  min: string;
  onChange: (value: number) => void;
  step: string;
  value: number;
}) {
  return (
    <label>
      {label}
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (!Number.isFinite(diffMs)) return "방금 전";

  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function shouldShowChatDateDivider(currentValue: string, previousValue?: string) {
  const current = new Date(currentValue).getTime();

  if (!Number.isFinite(current)) return false;
  if (!previousValue) return true;

  const previous = new Date(previousValue).getTime();

  if (!Number.isFinite(previous)) return true;

  return current - previous >= 24 * 60 * 60 * 1000;
}

function formatChatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "오늘";

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdays[date.getDay()]}`;
}

function formatChatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours < 12 ? "오전" : "오후";
  const displayHours = hours % 12 || 12;

  return `${meridiem} ${String(displayHours).padStart(2, "0")}:${minutes}`;
}

function ManagementSection({
  action,
  description,
  emptyMessage = "표시할 항목이 없습니다.",
  headers,
  rowLinks,
  rows,
  title,
}: {
  action: string;
  description: string;
  emptyMessage?: string;
  headers: string[];
  rowLinks?: string[];
  rows: string[][];
  title: string;
}) {
  return (
    <div className="my-section">
      <SectionTitle title={title} description={description} />
      <div className="filter-tabs">
        {["전체", "중고거래", "구인구직", "자유게시판", "생활정보", "부동산"].map((filter) => (
          <button key={filter} type="button">{filter}</button>
        ))}
      </div>
      <input className="my-search" placeholder="검색" />
      <div className="my-table">
        <div className="my-table-head">
          <label><input type="checkbox" /> 전체 선택</label>
          {headers.map((header) => <span key={header}>{header}</span>)}
        </div>
        {rows.length ? (
          rows.map((row, rowIndex) => (
            <div className="my-table-row" key={`${rowIndex}-${row.join("-")}`}>
              <input type="checkbox" />
              {row.map((cell, index) => {
                const href = index === 1 ? rowLinks?.[rowIndex] : null;

                return (
                  <span data-label={headers[index]} key={`${headers[index]}-${cell}`}>
                    {href ? <Link href={href}>{cell}</Link> : cell}
                  </span>
                );
              })}
            </div>
          ))
        ) : (
          <div className="my-table-empty">{emptyMessage}</div>
        )}
      </div>
      <Button variant="muted" type="button">{action}</Button>
    </div>
  );
}

function PostManagementSection({ initialPosts }: { initialPosts: PublicMarketPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const categories = useMemo(
    () => ["전체", ...Array.from(new Set(posts.map(getManagedPostCategory)))],
    [posts],
  );
  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return posts.filter((post) => {
      const category = getManagedPostCategory(post);
      const matchesCategory = selectedCategory === "전체" || category === selectedCategory;
      const matchesSearch = !keyword || [
        category,
        post.boardType,
        post.itemCategory,
        post.title,
        post.status,
        post.region,
      ].some((value) => value.toLowerCase().includes(keyword));

      return matchesCategory && matchesSearch;
    });
  }, [posts, search, selectedCategory]);
  const allVisibleSelected = filteredPosts.length > 0 && filteredPosts.every((post) => selectedIds.has(post.id));

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        filteredPosts.forEach((post) => next.delete(post.id));
      } else {
        filteredPosts.forEach((post) => next.add(post.id));
      }

      return next;
    });
  }

  function togglePost(postId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }

      return next;
    });
  }

  async function deleteSelected() {
    if (!selectedIds.size) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/my-page/posts", {
        body: JSON.stringify({ ids: [...selectedIds] }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "게시글을 삭제하지 못했습니다.");
      }

      const nextPosts = (result.posts ?? []) as PublicMarketPost[];

      setPosts(nextPosts);
      if (selectedCategory !== "전체" && !nextPosts.some((post) => getManagedPostCategory(post) === selectedCategory)) {
        setSelectedCategory("전체");
      }
      setSelectedIds(new Set());
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "게시글을 삭제하지 못했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="my-section">
      <SectionTitle title="내가 쓴 게시글 관리" description="내가 쓴 글을 원본 게시판과 연결해 확인하고 정리합니다." />
      <div className="filter-tabs">
        {categories.map((category) => (
          <button
            className={selectedCategory === category ? "active" : ""}
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setSelectedIds(new Set());
            }}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>
      <input
        className="my-search"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="검색"
        value={search}
      />
      <div className="my-table">
        <div className="my-table-head">
          <label><input checked={allVisibleSelected} onChange={toggleAllVisible} type="checkbox" /> 전체 선택</label>
          <span>분류</span>
          <span>제목</span>
          <span>상태</span>
          <span>조회</span>
          <span>댓글</span>
        </div>
        {filteredPosts.length ? (
          filteredPosts.map((post) => (
            <div className="my-table-row" key={post.id}>
              <input
                aria-label={`${post.title} 선택`}
                checked={selectedIds.has(post.id)}
                onChange={() => togglePost(post.id)}
                type="checkbox"
              />
              <span data-label="분류">{getManagedPostCategory(post)}</span>
              <span data-label="제목"><Link href={`/marketplace/${post.id}`}>{post.title}</Link></span>
              <span data-label="상태">{post.status}</span>
              <span data-label="조회">{post.viewCount}</span>
              <span data-label="댓글">{post.commentCount}</span>
            </div>
          ))
        ) : (
          <div className="my-table-empty">아직 작성한 글이 없습니다.</div>
        )}
      </div>
      {deleteError ? <p className="my-table-message">{deleteError}</p> : null}
      <Button disabled={!selectedIds.size || isDeleting} onClick={() => void deleteSelected()} type="button" variant="muted">
        {isDeleting ? "삭제 중..." : "선택 삭제"}
      </Button>
    </div>
  );
}

function getManagedPostCategory(_post: PublicMarketPost) {
  return "마켓플레이스";
}

function BookmarkManagementSection({ initialPosts }: { initialPosts: PublicMarketPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const categories = useMemo(
    () => ["전체", ...Array.from(new Set(posts.map(getManagedPostCategory)))],
    [posts],
  );
  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return posts.filter((post) => {
      const category = getManagedPostCategory(post);
      const bookmarkedAt = formatManagedDateTime(post.bookmarkedAt);
      const matchesCategory = selectedCategory === "전체" || category === selectedCategory;
      const matchesSearch = !keyword || [
        category,
        post.boardType,
        post.itemCategory,
        post.title,
        post.priceLabel,
        post.region,
        post.status,
        bookmarkedAt,
      ].some((value) => value.toLowerCase().includes(keyword));

      return matchesCategory && matchesSearch;
    });
  }, [posts, search, selectedCategory]);
  const allVisibleSelected = filteredPosts.length > 0 && filteredPosts.every((post) => selectedIds.has(post.id));

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        filteredPosts.forEach((post) => next.delete(post.id));
      } else {
        filteredPosts.forEach((post) => next.add(post.id));
      }

      return next;
    });
  }

  function toggleBookmark(postId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }

      return next;
    });
  }

  async function deleteSelected() {
    if (!selectedIds.size) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/my-page/bookmarks", {
        body: JSON.stringify({ ids: [...selectedIds] }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "북마크를 삭제하지 못했습니다.");
      }

      const nextPosts = (result.posts ?? []) as PublicMarketPost[];

      setPosts(nextPosts);
      if (selectedCategory !== "전체" && !nextPosts.some((post) => getManagedPostCategory(post) === selectedCategory)) {
        setSelectedCategory("전체");
      }
      setSelectedIds(new Set());
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "북마크를 삭제하지 못했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="my-section">
      <SectionTitle title="북마크" description="북마크한 글을 원본 게시판과 연결해 확인하고 정리합니다." />
      <Link className="my-marketplace-bookmark-link" href="/marketplace?menu=bookmarks">
        마켓플레이스 북마크 보기
      </Link>
      <div className="filter-tabs">
        {categories.map((category) => (
          <button
            className={selectedCategory === category ? "active" : ""}
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setSelectedIds(new Set());
            }}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>
      <input
        className="my-search"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="검색"
        value={search}
      />
      <div className="my-table">
        <div className="my-table-head">
          <label><input checked={allVisibleSelected} onChange={toggleAllVisible} type="checkbox" /> 전체 선택</label>
          <span>분류</span>
          <span>제목</span>
          <span>정보</span>
          <span>찜한 날짜</span>
          <span>상태</span>
        </div>
        {filteredPosts.length ? (
          filteredPosts.map((post) => (
            <div className="my-table-row" key={post.id}>
              <input
                aria-label={`${post.title} 선택`}
                checked={selectedIds.has(post.id)}
                onChange={() => toggleBookmark(post.id)}
                type="checkbox"
              />
              <span data-label="분류">{getManagedPostCategory(post)}</span>
              <span data-label="제목"><Link href={`/marketplace/${post.id}`}>{post.title}</Link></span>
              <span data-label="정보">{post.priceLabel} · {post.region}</span>
              <span data-label="찜한 날짜">{formatManagedDateTime(post.bookmarkedAt)}</span>
              <span data-label="상태">{post.status}</span>
            </div>
          ))
        ) : (
          <div className="my-table-empty">아직 북마크한 글이 없습니다.</div>
        )}
      </div>
      {deleteError ? <p className="my-table-message">{deleteError}</p> : null}
      <Button disabled={!selectedIds.size || isDeleting} onClick={() => void deleteSelected()} type="button" variant="muted">
        {isDeleting ? "삭제 중..." : "북마크 삭제"}
      </Button>
    </div>
  );
}

function CommentManagementSection({ initialComments }: { initialComments: ManagedUserComment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const categories = useMemo(
    () => ["전체", ...Array.from(new Set(comments.map((comment) => comment.category)))],
    [comments],
  );
  const filteredComments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return comments.filter((comment) => {
      const matchesCategory = selectedCategory === "전체" || comment.category === selectedCategory;
      const matchesSearch = !keyword || [
        comment.category,
        comment.body,
        comment.sourceTitle,
        formatManagedCommentTime(comment.createdAt),
      ].some((value) => value.toLowerCase().includes(keyword));

      return matchesCategory && matchesSearch;
    });
  }, [comments, search, selectedCategory]);
  const allVisibleSelected = filteredComments.length > 0 && filteredComments.every((comment) => selectedIds.has(comment.id));

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        filteredComments.forEach((comment) => next.delete(comment.id));
      } else {
        filteredComments.forEach((comment) => next.add(comment.id));
      }

      return next;
    });
  }

  function toggleComment(commentId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }

      return next;
    });
  }

  async function deleteSelected() {
    if (!selectedIds.size) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/my-page/comments", {
        body: JSON.stringify({ ids: [...selectedIds] }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "댓글을 삭제하지 못했습니다.");
      }

      const nextComments = (result.comments ?? []) as ManagedUserComment[];

      setComments(nextComments);
      if (selectedCategory !== "전체" && !nextComments.some((comment) => comment.category === selectedCategory)) {
        setSelectedCategory("전체");
      }
      setSelectedIds(new Set());
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "댓글을 삭제하지 못했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="my-section">
      <SectionTitle title="내가 쓴 댓글 관리" description="DB와 Markdown으로 정리된 댓글을 원문 게시글 기준으로 확인합니다." />
      <div className="filter-tabs">
        {categories.map((category) => (
          <button
            className={selectedCategory === category ? "active" : ""}
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setSelectedIds(new Set());
            }}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>
      <input
        className="my-search"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="검색"
        value={search}
      />
      <div className="my-table my-table--comments">
        <div className="my-table-head">
          <label>
            <input checked={allVisibleSelected} onChange={toggleAllVisible} type="checkbox" />
            전체 선택
          </label>
          <span>분류</span>
          <span>댓글</span>
          <span>원문</span>
          <span>댓글 시간</span>
        </div>
        {filteredComments.length ? (
          filteredComments.map((comment) => (
            <div className="my-table-row" key={comment.id}>
              <input
                aria-label={`${comment.body} 선택`}
                checked={selectedIds.has(comment.id)}
                onChange={() => toggleComment(comment.id)}
                type="checkbox"
              />
              <span className="my-comment-cell my-comment-cell--category" data-label="분류">{comment.category}</span>
              <span className="my-comment-cell my-comment-cell--body" data-label="댓글">{comment.body}</span>
              <span className="my-comment-cell my-comment-cell--source" data-label="원문">
                {comment.sourceHref ? <Link href={comment.sourceHref}>{comment.sourceTitle}</Link> : comment.sourceTitle}
              </span>
              <span className="my-comment-cell my-comment-cell--time" data-label="댓글 시간">{formatManagedCommentTime(comment.createdAt)}</span>
            </div>
          ))
        ) : (
          <div className="my-table-empty">표시할 댓글이 없습니다.</div>
        )}
      </div>
      {deleteError ? <p className="my-table-message">{deleteError}</p> : null}
      <Button disabled={!selectedIds.size || isDeleting} onClick={() => void deleteSelected()} type="button" variant="muted">
        {isDeleting ? "삭제 중..." : "선택 삭제"}
      </Button>
    </div>
  );
}

function formatManagedDateTime(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours < 12 ? "오전" : "오후";
  const displayHours = hours % 12 || 12;

  return `${month}월 ${day}일 ${meridiem} ${String(displayHours).padStart(2, "0")}:${minutes}`;
}

function formatManagedCommentTime(value: string) {
  return formatManagedDateTime(value);
}
