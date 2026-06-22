import { randomBytes } from "crypto";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const stateCookieName = "korin_google_oauth_state";
const modeCookieName = "korin_google_oauth_mode";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const mode = request.nextUrl.searchParams.get("mode") === "signup" ? "signup" : "login";
  const fallbackPath = mode === "signup" ? "/auth/register" : "/auth/login";

  if (!clientId) {
    const url = new URL(fallbackPath, request.url);
    url.searchParams.set("error", "google_config");
    return NextResponse.redirect(url);
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const cookieStore = await cookies();
  cookieStore.set(stateCookieName, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  cookieStore.set(modeCookieName, mode, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.redirect(authUrl);
}
