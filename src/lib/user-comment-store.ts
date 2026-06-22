import { promises as fs } from "fs";
import path from "path";

import type { ManagedUserComment } from "@/types/user-comment";

const dataFile = path.join(process.cwd(), "data", "user-comments.json");
const markdownFile = path.join(process.cwd(), "data", "user-comments.md");

async function ensureStore() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }

  try {
    await fs.access(markdownFile);
  } catch {
    await fs.writeFile(markdownFile, "# User comments\n\n", "utf8");
  }
}

async function readBoardComments(): Promise<ManagedUserComment[]> {
  await ensureStore();

  const raw = await fs.readFile(dataFile, "utf8");

  return (JSON.parse(raw) as ManagedUserComment[]).map((comment) => ({
    ...comment,
    sourceHref: comment.sourceHref ?? null,
  }));
}

export async function getStoredUserComments(userId: string) {
  const comments = await readBoardComments();

  return comments
    .filter((comment) => comment.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteStoredUserComments(userId: string, ids: string[]) {
  await ensureStore();

  const idSet = new Set(ids);
  const comments = await readBoardComments();
  const deletedIds = comments
    .filter((comment) => comment.userId === userId && idSet.has(comment.id))
    .map((comment) => comment.id);

  if (!deletedIds.length) return [];

  const nextComments = comments.filter((comment) => !(comment.userId === userId && idSet.has(comment.id)));

  await fs.writeFile(dataFile, `${JSON.stringify(nextComments, null, 2)}\n`, "utf8");

  return deletedIds;
}

export async function syncUserCommentsMarkdown(comments: ManagedUserComment[]) {
  await ensureStore();

  const rows = comments.map((comment) => [
    `## ${comment.sourceTitle}`,
    "",
    `- id: ${comment.id}`,
    `- userId: ${comment.userId}`,
    `- category: ${comment.category}`,
    `- createdAt: ${comment.createdAt}`,
    `- sourceHref: ${comment.sourceHref ?? ""}`,
    "",
    comment.body,
    "",
  ].join("\n"));

  await fs.writeFile(markdownFile, `# User comments\n\n${rows.join("\n")}`, "utf8");
}
