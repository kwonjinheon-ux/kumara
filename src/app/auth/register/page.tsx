import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <AuthCard
        eyebrow="KumaraMarket.nz account"
        title="회원가입"
        description="이메일 인증으로 안전하게 가입합니다. 스마트폰 번호, 카카오톡 ID, 프로필 정보는 선택으로 입력할 수 있습니다."
        footer={
          <>
            이미 계정이 있나요? <Link href="/auth/login">로그인</Link>
          </>
        }
      >
        <RegisterForm />
      </AuthCard>
    </main>
  );
}
