import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : "";

  return (
    <main className="auth-page">
      <AuthCard
        eyebrow="Password help"
        title={token ? "새 비밀번호 설정" : "비밀번호 찾기"}
        description={
          token
            ? "메일로 받은 재설정 링크가 확인되었습니다. 새 비밀번호를 설정해 주세요."
            : "가입 이메일로 비밀번호 재설정 버튼을 보내드립니다."
        }
        footer={<Link href="/auth/login">로그인으로 돌아가기</Link>}
      >
        <ResetPasswordForm token={token} />
      </AuthCard>
    </main>
  );
}
