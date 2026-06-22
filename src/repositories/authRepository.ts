import { GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";

import { getFirebaseAuth } from "@/app/firebase";

// Auth repository is the only frontend layer that talks directly to Firebase Auth.
export const authRepository = {
  observeAuthState: (callback: Parameters<typeof onAuthStateChanged>[1]) => onAuthStateChanged(getFirebaseAuth(), callback),
  signInWithEmail: (email: string, password: string) => signInWithEmailAndPassword(getFirebaseAuth(), email, password),
  signInWithGoogle: () => signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider()),
  signOut: () => signOut(getFirebaseAuth()),
};
