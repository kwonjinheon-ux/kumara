"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/common/Button";

type FormState = {
  error: string;
  message: string;
  loading: boolean;
};

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
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

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    const result = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setState({
        error: result.error ?? "비밀번호 재설정 메일 발송에 실패했습니다.",
        message: "",
        loading: false,
      });
      return;
    }

    setState({
      error: "",
      message: result.message ?? "비밀번호 재설정 메일이 전송되었습니다.",
      loading: false,
    });
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ error: "", message: "", loading: true });

    if (passwordMismatch) {
      setState({ error: "패스워드가 맞지 않습니다.", message: "", loading: false });
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, passwordConfirm }),
    });
    const result = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setState({
        error: result.error ?? "비밀번호 변경에 실패했습니다.",
        message: "",
        loading: false,
      });
      return;
    }

    setState({
      error: "",
      message: result.message ?? "비밀번호가 변경되었습니다.",
      loading: false,
    });

    setTimeout(() => {
      router.push("/auth/login");
      router.refresh();
    }, 900);
  }

  if (!token) {
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
            가입한 이메일로 비밀번호 재설정 버튼을 보내드립니다. 메일의 버튼을 누르면
            이 화면에서 새 비밀번호를 설정할 수 있습니다.
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
          minLength={10}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="대소문자, 숫자, 특수문자 조합"
          required
          type="password"
          value={password}
        />
        <span className="field-hint">
          10자 이상, 영문 대문자/소문자/숫자/특수문자 중 3가지 이상 조합을 추천합니다.
        </span>
      </label>
      <label>
        새 비밀번호 재확인
        <input
          autoComplete="new-password"
          minLength={10}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          placeholder="비밀번호를 한 번 더 입력"
          required
          type="password"
          value={passwordConfirm}
        />
        {passwordMismatch ? <span className="field-error">패스워드가 맞지 않습니다.</span> : null}
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.message ? <p className="form-success">{state.message}</p> : null}
      <Button disabled={state.loading} fullWidth type="submit">
        {state.loading ? "변경 중..." : "새 비밀번호 설정"}
      </Button>
    </form>
  );
}
