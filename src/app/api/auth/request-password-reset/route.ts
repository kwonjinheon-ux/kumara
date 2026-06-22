import { NextResponse } from "next/server";

import { sendPasswordResetEmail } from "@/lib/mailer";
import { createPasswordReset } from "@/lib/password-reset-store";
import { findUserByEmail } from "@/lib/user-store";
import { isEmail, normalizeLoginId } from "@/lib/validation";

export const runtime = "nodejs";

function getBaseUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = normalizeLoginId(body?.email);

  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: "가입한 이메일 주소를 입력해 주세요." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  const genericMessage =
    "가입된 이메일이라면 비밀번호 재설정 메일이 전송됩니다. 이메일함을 확인해 주세요.";

  if (!user) {
    return NextResponse.json({ message: genericMessage });
  }

  try {
    const reset = await createPasswordReset({ email, userId: user.id });
    const resetUrl = `${getBaseUrl(request)}/auth/reset-password?token=${encodeURIComponent(
      reset.token,
    )}`;

    await sendPasswordResetEmail({
      email,
      resetUrl,
      expiresInMinutes: reset.expiresInMinutes,
    });

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    if (error instanceof Error && error.message === "SMTP_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "비밀번호 재설정 메일을 보내려면 SMTP 설정이 필요합니다." },
        { status: 500 },
      );
    }

    console.error("Failed to send password reset email", {
      email,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "비밀번호 재설정 메일 발송에 실패했습니다." },
      { status: 500 },
    );
  }
}
