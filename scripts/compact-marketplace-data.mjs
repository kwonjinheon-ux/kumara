import { readFile, stat, writeFile } from "node:fs/promises";

const dataFile = new URL("../data/market-posts.json", import.meta.url);
const maxInlineBytes = Number(process.env.MARKETPLACE_COMPACT_MAX_BYTES ?? 250_000);

const before = await stat(dataFile);
const posts = JSON.parse(await readFile(dataFile, "utf8"));
let replacedImages = 0;
let replacedInlineImages = 0;
let removedProfileImages = 0;

for (const post of posts) {
  const replacements = new Map();

  if (isOversizedDataImage(post.authorProfileImageUrl)) {
    post.authorProfileImageUrl = null;
    removedProfileImages += 1;
  }

  for (const comment of Array.isArray(post.comments) ? post.comments : []) {
    if (isOversizedDataImage(comment.authorProfileImageUrl)) {
      comment.authorProfileImageUrl = null;
      removedProfileImages += 1;
    }
  }

  for (const image of Array.isArray(post.images) ? post.images : []) {
    const compactUrl = getCompactUrl(image.dataUrl, image.thumbnailDataUrl);

    if (compactUrl && compactUrl !== image.dataUrl) {
      replacements.set(image.dataUrl, compactUrl);
      image.dataUrl = compactUrl;
      image.thumbnailDataUrl = compactUrl;
      replacedImages += 1;
    }
  }

  if (typeof post.thumbnailDataUrl === "string") {
    const coverImage = Array.isArray(post.images)
      ? post.images.find((image) => image.id === post.coverImageId) ?? post.images[0]
      : null;
    const compactThumbnail = getCompactUrl(post.thumbnailDataUrl, coverImage?.thumbnailDataUrl);

    if (compactThumbnail) {
      post.thumbnailDataUrl = compactThumbnail;
    }
  }

  if (typeof post.contentHtml === "string") {
    for (const [source, target] of replacements) {
      post.contentHtml = post.contentHtml.split(source).join(target);
    }

    post.contentHtml = post.contentHtml.replace(
      /src=(["'])(data:image\/[^"']+)\1/g,
      (match, quote, src) => {
        if (src.length <= maxInlineBytes) return match;

        const fallback = getCompactUrl(src, post.thumbnailDataUrl);
        if (!fallback || fallback === src) return match;

        replacedInlineImages += 1;
        return `src=${quote}${fallback}${quote}`;
      },
    );
  }
}

await writeFile(dataFile, `${JSON.stringify(posts)}\n`, "utf8");

const after = await stat(dataFile);
const savedBytes = before.size - after.size;

console.log(JSON.stringify({
  beforeBytes: before.size,
  afterBytes: after.size,
  savedBytes,
  replacedImages,
  replacedInlineImages,
  removedProfileImages,
}, null, 2));

function getCompactUrl(source, preferred) {
  if (typeof source !== "string" || !source.startsWith("data:image/")) return null;
  if (source.length <= maxInlineBytes) return source;

  if (
    typeof preferred === "string" &&
    preferred.startsWith("data:image/") &&
    preferred.length < source.length
  ) {
    return preferred;
  }

  return null;
}

function isOversizedDataImage(value) {
  return typeof value === "string" && value.startsWith("data:image/") && value.length > maxInlineBytes;
}
