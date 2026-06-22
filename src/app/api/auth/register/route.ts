import { NextResponse } from "next/server";

import { consumeVerifiedEmailToken } from "@/lib/email-verification-store";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import { setSessionCookie } from "@/lib/session";
import { createUser } from "@/lib/user-store";
import { isEmail, parseRegisterInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = parseRegisterInput(await request.json().catch(() => null));

  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const recaptcha = await verifyRecaptchaToken(parsed.data.recaptchaToken);
  if (!recaptcha.ok) {
    return NextResponse.json({ error: recaptcha.error }, { status: 400 });
  }

  if (!isEmail(parsed.data.loginId)) {
    return NextResponse.json({ error: "가입은 이메일 주소로만 가능합니다." }, { status: 400 });
  }

  if (!parsed.data.verificationToken) {
    return NextResponse.json(
      { error: "스팸 방지를 위해 이메일 인증을 완료해 주세요." },
      { status: 400 },
    );
  }

  const isEmailVerified = await consumeVerifiedEmailToken(
    parsed.data.loginId,
    parsed.data.verificationToken,
  );

  if (!isEmailVerified) {
    return NextResponse.json(
      { error: "이메일 인증이 만료되었거나 확인되지 않았습니다." },
      { status: 400 },
    );
  }

  try {
    const user = await createUser({
      loginId: parsed.data.loginId,
      password: parsed.data.password,
      nickname: parsed.data.nickname,
      referralId: parsed.data.referralId,
      profile: parsed.data.profile,
      isEmailVerified,
    });
    await setSessionCookie(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "회원가입에 실패했습니다." },
      { status: 409 },
    );
  }
}
