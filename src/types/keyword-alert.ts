export type KeywordAlertSettings = {
  keywords: string[];
  categoryScope: string[];
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  isActive: boolean;
  updatedAt: string | null;
};

export type StoredKeywordAlertSettings = KeywordAlertSettings & {
  userId: string;
};
