import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/session";
import { findOrCreateGoogleUser } from "@/lib/user-store";

export const runtime = "nodejs";

const stateCookieName = "korin_google_oauth_state";
const modeCookieName = "korin_google_oauth_mode";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(stateCookieName)?.value;
  const mode = cookieStore.get(modeCookieName)?.value === "signup" ? "signup" : "login";
  const fallbackPath = mode === "signup" ? "/auth/register" : "/auth/login";
  const fallbackUrl = new URL(fallbackPath, request.url);

  cookieStore.delete(stateCookieName);
  cookieStore.delete(modeCookieName);

  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");

  if (providerError) {
    fallbackUrl.searchParams.set("error", "google_cancelled");
    return NextResponse.redirect(fallbackUrl);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    fallbackUrl.searchParams.set("error", "google_state");
    return NextResponse.redirect(fallbackUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    fallbackUrl.searchParams.set("error", "google_config");
    return NextResponse.redirect(fallbackUrl);
  }

  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const token = (await tokenResponse.json().catch(() => ({}))) as GoogleTokenResponse;

  if (!tokenResponse.ok || !token.access_token) {
    fallbackUrl.searchParams.set("error", "google_token");
    return NextResponse.redirect(fallbackUrl);
  }

  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const userInfo = (await userInfoResponse.json().catch(() => ({}))) as GoogleUserInfo;

  if (!userInfoResponse.ok || !userInfo.sub || !userInfo.email || !userInfo.email_verified) {
    fallbackUrl.searchParams.set("error", "google_profile");
    return NextResponse.redirect(fallbackUrl);
  }

  const user = await findOrCreateGoogleUser({
    email: userInfo.email,
    googleId: userInfo.sub,
    name: userInfo.name ?? userInfo.email.split("@")[0],
    picture: userInfo.picture ?? null,
  });

  await setSessionCookie(user.id, true);

  return NextResponse.redirect(new URL("/my-page", request.url));
}
