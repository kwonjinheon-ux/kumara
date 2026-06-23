"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getFirebaseAuth } from "@/lib/firebase";
import { upsertFirebaseUserProfile } from "@/lib/firebase-auth-profile";

type GoogleAuthLinkProps = {
  mode: "login" | "signup";
};

export function GoogleAuthLink({ mode }: GoogleAuthLinkProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const label = mode === "signup" ? "Google로 회원가입" : "Google로 로그인";

  async function signInWithGoogle() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(getFirebaseAuth(), provider);

      await upsertFirebaseUserProfile(credential.user, {
        displayName: credential.user.displayName,
        photoURL: credential.user.photoURL,
      });

      router.push("/my-page");
      router.refresh();
    } catch (caught) {
      const code =
        typeof caught === "object" &&
        caught !== null &&
        "code" in caught &&
        typeof caught.code === "string"
          ? caught.code
          : "";
      setError(getGoogleAuthError(code));
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="google-auth-link"
        disabled={loading}
        onClick={() => void signInWithGoogle()}
        type="button"
      >
        <span className="google-auth-icon" aria-hidden="true">
          G
        </span>
        <span>{loading ? "Google 연결 중..." : label}</span>
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </>
  );
}

function getGoogleAuthError(code: string) {
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "Google 로그인이 취소되었습니다.";
  }

  if (code === "auth/unauthorized-domain") {
    return "Firebase Auth 승인된 도메인에 현재 배포 도메인을 추가해야 합니다.";
  }

  if (code === "auth/operation-not-allowed") {
    return "Firebase Console에서 Google 로그인 제공업체를 사용 설정해야 합니다.";
  }

  if (code === "auth/popup-blocked") {
    return "브라우저에서 팝업이 차단되었습니다. 팝업 허용 후 다시 시도해 주세요.";
  }

  return "Google 로그인에 실패했습니다. Firebase Console의 Google 제공업체 설정을 확인해 주세요.";
}
