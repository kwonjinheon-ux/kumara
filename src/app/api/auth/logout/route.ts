import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/session";

async function logoutAndRedirect(request: Request) {
  await clearSessionCookie();

  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.headers.set("Cache-Control", "no-store");

  return response;
}

export async function GET(request: Request) {
  return logoutAndRedirect(request);
}

export async function POST(request: Request) {
  return logoutAndRedirect(request);
}
