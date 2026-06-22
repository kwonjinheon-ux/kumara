import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { ButtonLink } from "@/components/common/Button";

export default function FindIdPage() {
  return (
    <main className="auth-page">
      <AuthCard
        eyebrow="Account help"
        title="아이디 찾기"
        description="Korin은 이메일로만 가입합니다. 가입할 때 사용한 이메일 주소가 로그인 ID입니다."
        footer={<Link href="/auth/login">로그인으로 돌아가기</Link>}
      >
        <div className="auth-info-panel">
          <p>
            현재 MVP에서는 이메일 인증 기반 가입만 허용합니다. 사용 중인 이메일함에서
            KumaraMarket.nz 인증 메일을 검색해 가입 이메일을 확인해 주세요.
          </p>
          <ButtonLink fullWidth href="/auth/login">
            로그인하기
          </ButtonLink>
        </div>
      </AuthCard>
    </main>
  );
}
