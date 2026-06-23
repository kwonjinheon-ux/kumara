"use client";

import { confirmPasswordReset, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/Button";
import { getFirebaseAuth } from "@/lib/firebase";

type FormState = {
  error: string;
  message: string;
  loading: boolean;
};

type ResetPasswordFormProps = {
  oobCode: string;
};

export function ResetPasswordForm({ oobCode }: ResetPasswordFormProps) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({
    error: "",
    message: "",
    loading: false,
  });
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const passwordMismatch = Boolean(passwordConfirm) && password !== passwordConfirm;

  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ error: "", message: "", loading: true });

    try {
      const form = new FormData(event.currentTarget);
      await sendPasswordResetEmail(getFirebaseAuth(), String(form.get("email") ?? ""), {
        url: `${window.location.origin}/auth/reset-password`,
      });
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "비밀번호 재설정 메일 발송에 실패했습니다.",
        message: "",
        loading: false,
      });
      return;
    }

    setState({
      error: "",
      message: "비밀번호 재설정 메일이 전송되었습니다.",
      loading: false,
    });
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ error: "", message: "", loading: true });

    if (passwordMismatch) {
      setState({ error: "비밀번호가 서로 일치하지 않습니다.", message: "", loading: false });
      return;
    }

    try {
      await confirmPasswordReset(getFirebaseAuth(), oobCode, password);
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.",
        message: "",
        loading: false,
      });
      return;
    }

    setState({
      error: "",
      message: "비밀번호가 변경되었습니다.",
      loading: false,
    });

    setTimeout(() => {
      router.push("/auth/login");
      router.refresh();
    }, 900);
  }

  if (!oobCode) {
    return (
      <form className="auth-form" onSubmit={requestReset}>
        <label>
          가입 이메일
          <input
            autoComplete="email"
            name="email"
            placeholder="name@example.com"
            required
            type="email"
          />
        </label>
        <div className="auth-info-panel compact">
          <p>
            가입한 이메일로 Firebase 비밀번호 재설정 링크를 보냅니다. 메일의 링크를 누르면 새
            비밀번호를 설정할 수 있습니다.
          </p>
        </div>
        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.message ? <p className="form-success">{state.message}</p> : null}
        <Button disabled={state.loading} fullWidth type="submit">
          {state.loading ? "메일 전송 중..." : "비밀번호 재설정 메일 받기"}
        </Button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={resetPassword}>
      <label>
        새 비밀번호
        <input
          autoComplete="new-password"
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="새 비밀번호를 입력하세요"
          required
          type="password"
          value={password}
        />
      </label>
      <label>
        새 비밀번호 재확인
        <input
          autoComplete="new-password"
          minLength={6}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          placeholder="비밀번호를 한 번 더 입력"
          required
          type="password"
          value={passwordConfirm}
        />
        {passwordMismatch ? <span className="field-error">비밀번호가 서로 일치하지 않습니다.</span> : null}
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.message ? <p className="form-success">{state.message}</p> : null}
      <Button disabled={state.loading} fullWidth type="submit">
        {state.loading ? "변경 중..." : "새 비밀번호 설정"}
      </Button>
    </form>
  );
}
