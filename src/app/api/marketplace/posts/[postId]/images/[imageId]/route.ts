import { NextResponse } from "next/server";

import { getMarketPostImageData } from "@/lib/marketplace-store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ imageId: string; postId: string }> },
) {
  const { imageId, postId } = await params;
  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") === "thumb" ? "thumb" : "full";
  const dataUrl = await getMarketPostImageData(postId, imageId, variant);
  const parsed = parseDataUrl(dataUrl);

  if (!parsed) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(parsed.body, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": parsed.contentType,
    },
  });
}

function parseDataUrl(value: string | null | undefined) {
  if (!value) return null;

  const commaIndex = value.indexOf(",");
  if (!value.startsWith("data:") || commaIndex < 0) return null;

  const meta = value.slice(5, commaIndex);
  const [contentType = "application/octet-stream"] = meta.split(";");
  const isBase64 = meta.split(";").includes("base64");
  const payload = value.slice(commaIndex + 1);

  return {
    body: isBase64 ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload)),
    contentType,
  };
}
