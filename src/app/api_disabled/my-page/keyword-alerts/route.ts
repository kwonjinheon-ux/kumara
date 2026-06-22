import { NextResponse } from "next/server";

import type { MembershipLevel } from "@/config/membershipLevels";
import { getCurrentUser } from "@/lib/current-user";
import { getKeywordAlertSettings, saveKeywordAlertSettings } from "@/lib/keyword-alert-store";
import type { KeywordAlertSettings } from "@/types/keyword-alert";

const keywordLimitByLevel: Record<MembershipLevel, number> = {
  iron: 5,
  silver: 8,
  gold: 12,
  platinum: 20,
  diamond: 30,
  master: 50,
  master_plus: 100,
};

const allowedCategoryScopes = new Set(["마켓플레이스", "부동산", "구인구직", "자유게시판", "생활정보"]);

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

function normalizeKeywords(value: unknown) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const item of value) {
    const keyword = String(item ?? "").trim().replace(/\s+/g, " ");
    const key = keyword.toLowerCase();

    if (keyword.length < 2 || seen.has(key)) continue;

    seen.add(key);
    keywords.push(keyword.slice(0, 40));
  }

  return keywords.slice(0, 100);
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const settings = await getKeywordAlertSettings(user.id);

  return NextResponse.json({
    keywordLimit: keywordLimitByLevel[user.membershipLevel],
    settings,
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as Partial<KeywordAlertSettings> | null;

  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const keywords = normalizeKeywords(body.keywords);
  const keywordLimit = keywordLimitByLevel[user.membershipLevel];

  if (keywords.length > keywordLimit) {
    return NextResponse.json(
      { error: `현재 등급에서는 키워드를 최대 ${keywordLimit}개까지 등록할 수 있습니다.` },
      { status: 400 },
    );
  }

  const settings = await saveKeywordAlertSettings(user.id, {
    keywords,
    categoryScope: normalizeStringArray(body.categoryScope, 8),
    notifyInApp: body.notifyInApp !== false,
    notifyEmail: body.notifyEmail === true,
    notifyPush: body.notifyPush === true,
    isActive: body.isActive !== false,
  });

  return NextResponse.json({ keywordLimit, settings });
}
