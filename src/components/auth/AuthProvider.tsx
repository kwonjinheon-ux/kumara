"use client";

import {
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

export type FirebaseUserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  role: "user" | "admin" | "moderator";
  emailVerified: boolean;
};

function fallbackProfileFromUser(user: FirebaseUser): FirebaseUserProfile {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "User",
    photoURL: user.photoURL,
    role: "user",
    emailVerified: user.emailVerified,
  };
}

type AuthContextValue = {
  firebaseUser: FirebaseUser | null;
  profile: FirebaseUserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<FirebaseUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user: FirebaseUser | null) => {
    if (!user) {
      setProfile(null);
      return;
    }

    const ref = doc(getFirestoreDb(), "users", user.uid);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      const fallbackProfile = fallbackProfileFromUser(user);

      await setDoc(ref, {
        ...fallbackProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setProfile(fallbackProfile);
      return;
    }

    const data = snapshot.data();
    setProfile({
      uid: user.uid,
      email: typeof data.email === "string" ? data.email : user.email,
      displayName:
        typeof data.displayName === "string"
          ? data.displayName
          : user.displayName ?? user.email?.split("@")[0] ?? "User",
      photoURL: typeof data.photoURL === "string" ? data.photoURL : user.photoURL,
      role: data.role === "admin" || data.role === "moderator" ? data.role : "user",
      emailVerified: user.emailVerified,
    });
  }, []);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), async (user) => {
      setLoading(true);
      setFirebaseUser(user);
      try {
        await loadProfile(user);
      } catch (error) {
        console.error("Failed to load Firebase user profile.", error);
        setProfile(user ? fallbackProfileFromUser(user) : null);
      } finally {
        setLoading(false);
      }
    });
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      loading,
      profile,
      logout: () => signOut(getFirebaseAuth()),
      refreshProfile: async () => {
        await getFirebaseAuth().currentUser?.reload();
        const currentUser = getFirebaseAuth().currentUser;
        try {
          await loadProfile(currentUser);
        } catch (error) {
          console.error("Failed to refresh Firebase user profile.", error);
          setProfile(currentUser ? fallbackProfileFromUser(currentUser) : null);
        }
      },
    }),
    [firebaseUser, loadProfile, loading, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
