import { NextResponse } from "next/server";

import { createEmailVerification } from "@/lib/email-verification-store";
import { sendVerificationEmail } from "@/lib/mailer";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import { isEmail, normalizeLoginId } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    recaptchaToken?: unknown;
  } | null;
  const email = normalizeLoginId(body?.email);

  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: "올바른 이메일을 입력해 주세요." }, { status: 400 });
  }

  const recaptcha = await verifyRecaptchaToken(body?.recaptchaToken);
  if (!recaptcha.ok) {
    return NextResponse.json({ error: recaptcha.error }, { status: 400 });
  }

  try {
    const verification = await createEmailVerification(email);
    await sendVerificationEmail({
      email,
      code: verification.code,
      expiresInMinutes: verification.expiresInMinutes,
    });

    return NextResponse.json({
      message: `인증코드가 전송되었습니다. ${verification.expiresInMinutes}분 안에 이메일함의 6자리 코드를 입력해 주세요.`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SMTP_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "이메일 인증을 사용하려면 SMTP 설정이 필요합니다." },
        { status: 500 },
      );
    }

    console.error("Failed to send sign-up verification email", {
      email,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: "인증 메일 발송에 실패했습니다." }, { status: 500 });
  }
}
