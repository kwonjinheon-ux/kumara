"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";

type ProfileInput = {
  displayName?: string | null;
  photoURL?: string | null;
  extra?: Record<string, unknown>;
};

export async function upsertFirebaseUserProfile(user: User, input: ProfileInput = {}) {
  const ref = doc(getFirestoreDb(), "users", user.uid);
  const snapshot = await getDoc(ref);
  const displayName =
    input.displayName?.trim() ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "User";
  const photoURL = input.photoURL ?? user.photoURL ?? null;

  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL,
      role: snapshot.exists() ? snapshot.data().role ?? "user" : "user",
      emailVerified: user.emailVerified,
      updatedAt: serverTimestamp(),
      ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
      ...(input.extra ?? {}),
    },
    { merge: true },
  );
}
