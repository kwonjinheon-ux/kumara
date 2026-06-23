import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    oobCode?: string;
    token?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const oobCode =
    typeof params?.oobCode === "string"
      ? params.oobCode
      : typeof params?.token === "string"
        ? params.token
        : "";

  return (
    <main className="auth-page">
      <AuthCard
        eyebrow="Password help"
        title={oobCode ? "새 비밀번호 설정" : "비밀번호 찾기"}
        description={
          oobCode
            ? "메일로 받은 Firebase 재설정 링크가 확인되었습니다. 새 비밀번호를 설정해 주세요."
            : "가입 이메일로 Firebase 비밀번호 재설정 링크를 보내드립니다."
        }
        footer={<Link href="/auth/login">로그인으로 돌아가기</Link>}
      >
        <ResetPasswordForm oobCode={oobCode} />
      </AuthCard>
    </main>
  );
}
