import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";

import { getFirestoreDb } from "@/app/firebase";
import type { Comment } from "@/models/Comment";

// Comment repository keeps comment subcollection access out of Views and ViewModels.
export const commentRepository = {
  async listByPost(postId: string) {
    const snapshot = await getDocs(query(collection(getFirestoreDb(), "posts", postId, "comments"), orderBy("createdAt", "asc")));
    return snapshot.docs.map((commentDoc) => ({ id: commentDoc.id, ...commentDoc.data() })) as Comment[];
  },

  async create(postId: string, values: Omit<Comment, "id" | "createdAt">) {
    return addDoc(collection(getFirestoreDb(), "posts", postId, "comments"), {
      ...values,
      createdAt: serverTimestamp(),
    });
  },

  async remove(postId: string, commentId: string) {
    await deleteDoc(doc(getFirestoreDb(), "posts", postId, "comments", commentId));
  },
};
