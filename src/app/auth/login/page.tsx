import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/common/Button";
import { getCurrentUser } from "@/lib/current-user";

export default async function LoginPage() {
  const user = await getCurrentUser();

  return (
    <main className="auth-page">
      <AuthCard
        eyebrow="Welcome back"
        title={user ? "내 계정" : "로그인"}
        description={
          user
            ? "Korin에서 사용할 계정 정보입니다."
            : "이메일과 비밀번호로 로그인합니다."
        }
        footer={
          user ? (
            <Link href="/">홈으로 돌아가기</Link>
          ) : (
            <>
              아직 계정이 없나요? <Link href="/auth/register">회원가입</Link>
            </>
          )
        }
      >
        {user ? (
          <div className="account-summary">
            <dl>
              <div>
                <dt>닉네임</dt>
                <dd>{user.nickname}</dd>
              </div>
              <div>
                <dt>로그인 ID</dt>
                <dd className="identity-line">
                  <span>{user.email ?? user.phone}</span>
                  {user.email && user.isEmailVerified ? (
                    <span className="verified-badge" title="인증된 이메일">
                      인증됨
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt>거래 가능 지역</dt>
                <dd>{user.profile.tradeArea ?? "미입력"}</dd>
              </div>
              <div>
                <dt>스마트폰 번호</dt>
                <dd>{user.profile.smartphoneNumber ?? "미입력"}</dd>
              </div>
              <div>
                <dt>카카오톡 ID</dt>
                <dd>{user.profile.kakaoTalkId ?? "미입력"}</dd>
              </div>
              <div>
                <dt>추천인 ID</dt>
                <dd>{user.referralId ?? "없음"}</dd>
              </div>
              <div>
                <dt>회원 등급</dt>
                <dd>{user.membershipLevel}</dd>
              </div>
              <div>
                <dt>상태</dt>
                <dd>{user.status === "pending_verification" ? "인증 대기" : "활성"}</dd>
              </div>
            </dl>
            <form action="/api/auth/logout" method="post">
              <Button fullWidth type="submit">로그아웃</Button>
            </form>
          </div>
        ) : (
          <LoginForm />
        )}
      </AuthCard>
    </main>
  );
}
