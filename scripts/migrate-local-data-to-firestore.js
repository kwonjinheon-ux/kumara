/* eslint-disable no-console */
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const sourceFile = process.env.KUMARA_MARKET_POSTS_FILE || path.join(process.cwd(), "data", "market-posts.json");

  if (!getApps().length) {
    if (serviceAccountPath) {
      const serviceAccount = require(path.resolve(serviceAccountPath));
      initializeApp({ credential: cert(serviceAccount), projectId });
    } else {
      initializeApp({ projectId });
    }
  }

  const db = getFirestore();
  const raw = await readFile(sourceFile, "utf8");
  const posts = JSON.parse(raw);

  if (!Array.isArray(posts)) {
    throw new Error(`${sourceFile} must contain an array of posts.`);
  }

  let migrated = 0;
  for (const post of posts) {
    const id = String(post.id || db.collection("posts").doc().id);
    await db.collection("posts").doc(id).set({
      ...post,
      id,
      authorId: post.authorId || post.userId || "legacy",
      authorName: post.authorName || post.authorNickname || "Legacy user",
      authorPhotoURL: post.authorPhotoURL || post.authorProfileImageUrl || null,
      category: post.category || post.itemCategory || "legacy",
      imageUrls: Array.isArray(post.imageUrls)
        ? post.imageUrls
        : Array.isArray(post.images)
          ? post.images.map((image) => image.dataUrl).filter(Boolean)
          : [],
      location: post.location || post.region || "",
      price: typeof post.price === "number" ? post.price : post.priceAmount || null,
      status: post.status || "판매중",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    migrated += 1;
  }

  console.log(`Migrated ${migrated} posts from ${sourceFile} to Firestore posts collection.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
