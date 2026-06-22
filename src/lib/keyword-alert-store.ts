import { promises as fs } from "fs";
import path from "path";

import type { KeywordAlertSettings, StoredKeywordAlertSettings } from "@/types/keyword-alert";

const dataFile = path.join(process.cwd(), "data", "keyword-alerts.json");

const defaultSettings: KeywordAlertSettings = {
  keywords: [],
  categoryScope: ["마켓플레이스", "부동산", "구인구직"],
  notifyInApp: true,
  notifyEmail: false,
  notifyPush: false,
  isActive: true,
  updatedAt: null,
};

const allowedCategoryScopes = new Set(["마켓플레이스", "부동산", "구인구직", "자유게시판", "생활정보"]);

async function ensureStore() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }
}

async function readSettings(): Promise<StoredKeywordAlertSettings[]> {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as StoredKeywordAlertSettings[];
}

async function writeSettings(settings: StoredKeywordAlertSettings[]) {
  await ensureStore();
  await fs.writeFile(dataFile, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

function normalizeSettings(settings?: Partial<KeywordAlertSettings> | null): KeywordAlertSettings {
  return {
    ...defaultSettings,
    ...(settings ?? {}),
    keywords: normalizeKeywords(settings?.keywords ?? []),
    categoryScope: normalizeStringArray(settings?.categoryScope ?? defaultSettings.categoryScope, 8),
    notifyInApp: settings?.notifyInApp ?? defaultSettings.notifyInApp,
    notifyEmail: settings?.notifyEmail ?? defaultSettings.notifyEmail,
    notifyPush: settings?.notifyPush ?? defaultSettings.notifyPush,
    isActive: settings?.isActive ?? defaultSettings.isActive,
    updatedAt: settings?.updatedAt ?? null,
  };
}

function normalizeKeywords(keywords: unknown) {
  if (!Array.isArray(keywords)) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of keywords) {
    const keyword = String(item ?? "").trim().replace(/\s+/g, " ");
    const key = keyword.toLowerCase();

    if (keyword.length < 2 || seen.has(key)) continue;

    seen.add(key);
    normalized.push(keyword.slice(0, 40));
  }

  return normalized.slice(0, 100);
}

function normalizeStringArray(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((item) => {
      const scope = String(item ?? "").trim();

      return scope === "중고거래" ? "마켓플레이스" : scope;
    })
    .filter((scope) => allowedCategoryScopes.has(scope));

  return Array.from(new Set(normalized)).slice(0, maxItems);
}

export async function getKeywordAlertSettings(userId: string): Promise<KeywordAlertSettings> {
  const settings = await readSettings();
  const found = settings.find((item) => item.userId === userId);

  return normalizeSettings(found);
}

export async function getAllKeywordAlertSettings() {
  const settings = await readSettings();

  return settings.map((item) => ({
    userId: item.userId,
    ...normalizeSettings(item),
  }));
}

export async function saveKeywordAlertSettings(
  userId: string,
  input: Partial<KeywordAlertSettings>,
) {
  const settings = await readSettings();
  const index = settings.findIndex((item) => item.userId === userId);
  const now = new Date().toISOString();
  const nextSettings: StoredKeywordAlertSettings = {
    userId,
    ...normalizeSettings({
      ...(index >= 0 ? settings[index] : defaultSettings),
      ...input,
      updatedAt: now,
    }),
    updatedAt: now,
  };

  if (index >= 0) {
    settings[index] = nextSettings;
  } else {
    settings.push(nextSettings);
  }

  await writeSettings(settings);

  return getKeywordAlertSettings(userId);
}
