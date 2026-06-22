import { NextResponse } from "next/server";

import { consumePasswordResetToken } from "@/lib/password-reset-store";
import { updateUserPassword } from "@/lib/user-store";
import { validateStrongPassword } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    token?: unknown;
    password?: unknown;
    passwordConfirm?: unknown;
  } | null;
  const token = String(body?.token ?? "").trim();
  const password = String(body?.password ?? "");
  const passwordConfirm = String(body?.passwordConfirm ?? "");

  if (!token) {
    return NextResponse.json({ error: "비밀번호 재설정 링크가 올바르지 않습니다." }, { status: 400 });
  }

  const passwordError = validateStrongPassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  if (password !== passwordConfirm) {
    return NextResponse.json({ error: "비밀번호가 서로 일치하지 않습니다." }, { status: 400 });
  }

  const reset = await consumePasswordResetToken(token);
  if (!reset) {
    return NextResponse.json(
      { error: "비밀번호 재설정 링크가 만료되었거나 이미 사용되었습니다." },
      { status: 400 },
    );
  }

  const updated = await updateUserPassword(reset.userId, password);
  if (!updated) {
    return NextResponse.json({ error: "비밀번호를 변경할 수 없습니다." }, { status: 400 });
  }

  return NextResponse.json({ message: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요." });
}
