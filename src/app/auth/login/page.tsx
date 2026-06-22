import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <AuthCard
        eyebrow="Welcome back"
        title="로그인"
        description="Firebase 이메일/비밀번호로 로그인합니다."
        footer={
          <>
            아직 계정이 없나요? <Link href="/auth/register">회원가입</Link>
          </>
        }
      >
        <LoginForm />
      </AuthCard>
    </main>
  );
}
