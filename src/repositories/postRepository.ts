import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { getFirestoreDb } from "@/app/firebase";
import type { Post } from "@/models/Post";

// Post repository owns Firestore reads/writes for marketplace posts.
function postsCollection() {
  return collection(getFirestoreDb(), "posts");
}

export const postRepository = {
  async listPublishedPosts(maxCount = 40) {
    const snapshot = await getDocs(query(postsCollection(), where("visibility", "==", "public"), orderBy("createdAt", "desc"), limit(maxCount)));
    return snapshot.docs.map((postDoc) => ({ id: postDoc.id, ...postDoc.data() })) as Post[];
  },

  async markDeleted(postId: string) {
    await updateDoc(doc(getFirestoreDb(), "posts", postId), {
      deletedAt: serverTimestamp(),
      visibility: "deleted",
    });
  },

  async deleteMany(postIds: string[]) {
    const batch = writeBatch(getFirestoreDb());
    postIds.forEach((postId) => {
      batch.update(doc(getFirestoreDb(), "posts", postId), {
        deletedAt: serverTimestamp(),
        visibility: "deleted",
      });
    });
    await batch.commit();
    return postIds;
  },

  async removeBookmark(userId: string, postId: string) {
    await deleteDoc(doc(getFirestoreDb(), "users", userId, "bookmarks", postId));
    return postId;
  },
};
