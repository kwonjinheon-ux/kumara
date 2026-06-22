import { NextResponse } from "next/server";

import { verifyEmailCode } from "@/lib/email-verification-store";
import { isEmail, normalizeLoginId } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    code?: unknown;
  } | null;
  const email = normalizeLoginId(body?.email);
  const code = String(body?.code ?? "").trim();

  if (!email || !isEmail(email) || !code) {
    return NextResponse.json(
      { error: "이메일과 인증 코드를 입력해 주세요." },
      { status: 400 },
    );
  }

  const result = await verifyEmailCode(email, code);

  if (!result) {
    return NextResponse.json(
      { error: "인증 코드가 올바르지 않거나 만료되었습니다." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    message: "이메일 인증이 완료되었습니다.",
    verificationToken: result.verificationToken,
  });
}
