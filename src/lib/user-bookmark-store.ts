import { promises as fs } from "fs";
import path from "path";

import type { PublicMarketPost } from "@/types/marketplace";

const markdownFile = path.join(process.cwd(), "data", "user-bookmarks.md");

async function ensureStore() {
  await fs.mkdir(path.dirname(markdownFile), { recursive: true });

  try {
    await fs.access(markdownFile);
  } catch {
    await fs.writeFile(markdownFile, "# User bookmarks\n\n", "utf8");
  }
}

export async function syncUserBookmarksMarkdown(userId: string, posts: PublicMarketPost[]) {
  await ensureStore();

  const rows = posts.map((post) => [
    `## ${post.title}`,
    "",
    `- id: marketplace:${post.id}`,
    `- userId: ${userId}`,
    `- category: 마켓플레이스`,
    `- boardType: ${post.boardType}`,
    `- itemCategory: ${post.itemCategory}`,
    `- bookmarkedAt: ${post.bookmarkedAt ?? ""}`,
    `- status: ${post.status}`,
    `- sourceHref: /marketplace/${post.id}`,
    "",
    `${post.priceLabel} · ${post.region} · ${post.status}`,
    "",
  ].join("\n"));

  await fs.writeFile(markdownFile, `# User bookmarks\n\n${rows.join("\n")}`, "utf8");
}
