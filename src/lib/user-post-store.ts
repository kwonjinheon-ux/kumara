import { promises as fs } from "fs";
import path from "path";

import type { PublicMarketPost } from "@/types/marketplace";

const markdownFile = path.join(process.cwd(), "data", "user-posts.md");

async function ensureStore() {
  await fs.mkdir(path.dirname(markdownFile), { recursive: true });

  try {
    await fs.access(markdownFile);
  } catch {
    await fs.writeFile(markdownFile, "# User posts\n\n", "utf8");
  }
}

export async function syncUserPostsMarkdown(userId: string, posts: PublicMarketPost[]) {
  await ensureStore();

  const rows = posts.map((post) => [
    `## ${post.title}`,
    "",
    `- id: marketplace:${post.id}`,
    `- userId: ${userId}`,
    `- category: 마켓플레이스`,
    `- boardType: ${post.boardType}`,
    `- itemCategory: ${post.itemCategory}`,
    `- status: ${post.status}`,
    `- createdAt: ${post.createdAt}`,
    `- sourceHref: /marketplace/${post.id}`,
    "",
    post.content,
    "",
  ].join("\n"));

  await fs.writeFile(markdownFile, `# User posts\n\n${rows.join("\n")}`, "utf8");
}
