"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { GoogleAuthLink } from "@/components/auth/GoogleAuthLink";
import { Button } from "@/components/common/Button";
import { getFirebaseAuth } from "@/lib/firebase";

type FormState = {
  error: string;
  loading: boolean;
};

export function LoginForm() {
  const [state, setState] = useState<FormState>({ error: "", loading: false });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");

    if (error?.startsWith("google")) {
      setState({
        error: getGoogleAuthError(error),
        loading: false,
      });
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ error: "", loading: true });

    const form = new FormData(event.currentTarget);

    try {
      await signInWithEmailAndPassword(
        getFirebaseAuth(),
        String(form.get("loginId") ?? ""),
        String(form.get("password") ?? ""),
      );
      window.location.assign("/my-page");
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "로그인에 실패했습니다.",
        loading: false,
      });
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        이메일
        <input
          autoComplete="email"
          name="loginId"
          placeholder="name@example.com"
          required
          type="email"
        />
      </label>
      <label>
        비밀번호
        <span className="password-input-wrap">
          <input
            autoComplete="current-password"
            name="password"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            aria-pressed={showPassword}
            className="password-visibility-toggle"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            <EyeIcon hidden={showPassword} />
          </button>
        </span>
      </label>
      <div className="login-options">
        <label className="remember-row">
          <input name="rememberMe" type="checkbox" />
          <span>
            <strong>로그인 유지</strong>
            <small>Firebase Auth가 이 브라우저의 로그인 상태를 유지합니다.</small>
          </span>
        </label>
        <div className="login-help-links">
          <Link href="/auth/find-id">아이디 찾기</Link>
          <span aria-hidden="true" />
          <Link href="/auth/reset-password">비밀번호 찾기</Link>
        </div>
      </div>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <Button disabled={state.loading} fullWidth type="submit">
        {state.loading ? "로그인 중..." : "로그인"}
      </Button>
      <div className="auth-divider">
        <span>또는</span>
      </div>
      <GoogleAuthLink mode="login" />
    </form>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
      <path
        d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      {hidden ? null : (
        <path
          d="M4 20 20 4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

function getGoogleAuthError(error: string) {
  if (error === "google_config") {
    return "Google 로그인을 사용하려면 서버에 Google OAuth 설정이 필요합니다.";
  }

  if (error === "google_cancelled") {
    return "Google 로그인이 취소되었습니다.";
  }

  return "Google 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}
