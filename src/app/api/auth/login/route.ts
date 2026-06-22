import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/session";
import { authenticateUser } from "@/lib/user-store";
import { parseLoginInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormRequest = contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");
  const body = isFormRequest
    ? Object.fromEntries((await request.formData()).entries())
    : await request.json().catch(() => null);
  const parsed = parseLoginInput(body);

  if (!parsed.data) {
    if (isFormRequest) {
      return NextResponse.redirect(new URL("/auth/login?error=invalid", request.url), 303);
    }

    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const user = await authenticateUser(parsed.data.loginId, parsed.data.password);

  if (!user) {
    if (isFormRequest) {
      return NextResponse.redirect(new URL("/auth/login?error=credentials", request.url), 303);
    }

    return NextResponse.json(
      { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  await setSessionCookie(user.id, Boolean(body?.rememberMe));

  if (isFormRequest) {
    return NextResponse.redirect(new URL("/my-page", request.url), 303);
  }

  return NextResponse.json({ user });
}
