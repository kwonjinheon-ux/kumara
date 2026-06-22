import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getSessionUserId } from "@/lib/session";
import { syncMarketplaceAuthorProfile } from "@/lib/marketplace-store";
import { updateUserProfile } from "@/lib/user-store";

const imageSourcePattern = /^(https?:\/\/.+\..+|data:image\/(png|jpeg|jpg|webp);base64,)/;
const nicknamePattern = /^[A-Za-z0-9가-힣_.-]{2,20}$/;
const kakaoTalkIdPattern = /^[A-Za-z0-9_.-]{3,30}$/;
const phonePattern = /^\+?[0-9][0-9\s()-]{6,20}$/;

function optionalText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : null;
}

function parseBoolean(value: unknown) {
  return value === true;
}

function numberInRange(value: unknown, fallback: number, min: number, max: number) {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export async function PUT(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const nickname = optionalText(body.nickname, 20) ?? "";
  const smartphoneNumber = optionalText(body.smartphoneNumber, 30);
  const kakaoTalkId = optionalText(body.kakaoTalkId, 30);
  const profileImageUrl = optionalText(body.profileImageUrl, 2_500_000);
  const profileImageScale = numberInRange(body.profileImageScale, 1, 0.8, 1.8);
  const profileImageX = numberInRange(body.profileImageX, 0, -24, 24);
  const profileImageY = numberInRange(body.profileImageY, 0, -24, 24);

  if (!nicknamePattern.test(nickname)) {
    return NextResponse.json(
      { error: "닉네임은 2~20자의 한글, 영문, 숫자, _, ., -만 사용할 수 있습니다." },
      { status: 400 },
    );
  }

  if (smartphoneNumber && !phonePattern.test(smartphoneNumber)) {
    return NextResponse.json({ error: "올바른 전화번호를 입력해 주세요." }, { status: 400 });
  }

  if (kakaoTalkId && !kakaoTalkIdPattern.test(kakaoTalkId)) {
    return NextResponse.json(
      { error: "카카오톡 ID는 3~30자의 영문, 숫자, _, ., -만 사용할 수 있습니다." },
      { status: 400 },
    );
  }

  if (profileImageUrl && !imageSourcePattern.test(profileImageUrl)) {
    return NextResponse.json({ error: "프로필 이미지는 이미지 URL 또는 업로드 이미지여야 합니다." }, { status: 400 });
  }

  try {
    const user = await updateUserProfile(userId, {
      nickname,
      phone: smartphoneNumber,
      profile: {
        profileImageUrl,
        profileImageScale,
        profileImageX,
        profileImageY,
        city: optionalText(body.city, 80),
        suburb: optionalText(body.suburb, 80),
        tradeArea: optionalText(body.city, 80),
        kakaoTalkId,
        smartphoneNumber,
        bio: optionalText(body.bio, 300),
        allowChat: parseBoolean(body.allowChat),
        showKakaoTalkId: parseBoolean(body.showKakaoTalkId),
        showPhoneNumber: parseBoolean(body.showPhoneNumber),
        notificationComments: parseBoolean(body.notificationComments),
        notificationSavedPosts: parseBoolean(body.notificationSavedPosts),
        notificationTradeMessages: parseBoolean(body.notificationTradeMessages),
      },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    await syncMarketplaceAuthorProfile(user);
    revalidatePath("/my-page");
    revalidatePath("/marketplace");

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "프로필 저장에 실패했습니다." },
      { status: 400 },
    );
  }
}
