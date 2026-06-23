import { Button, ButtonLink } from "@/components/common/Button";
import type { User } from "@/models/User";

import styles from "./HomePage.module.css";

// HomePage View renders the home screen; state and backend access stay outside.
export function HomePageView({ user }: { user: User | null }) {
  const statusText = user ? `${user.nickname} 로그인됨` : "게스트";
  const statusDescription = user
    ? `${user.membershipLevel} 등급 기준으로 마켓, 알림, 내 페이지 기능을 사용할 수 있습니다.`
    : "로그인하면 글쓰기, 북마크, 채팅, 알림 기능을 사용할 수 있습니다.";

  return (
    <main className={`${styles.page} home-page`}>
      <section className="home-dashboard" aria-label="Kumara 홈">
        <div className="home-primary">
          <p className="eyebrow">TTRR COMMUNITY</p>
          <h1>뉴질랜드 한인 생활을 한 화면에서</h1>
          <p className="lead">중고거래, 알림, 내 활동 관리를 빠르게 오갈 수 있는 커뮤니티 홈입니다.</p>
          <div className="home-actions">
            {user ? (
              <>
                <ButtonLink href="/my-page">내 페이지</ButtonLink>
                <ButtonLink href="/marketplace?menu=sell" variant="muted">마켓플레이스</ButtonLink>
                <form action="/my-page?tab=security" method="get">
                  <Button type="submit" variant="muted">로그아웃</Button>
                </form>
              </>
            ) : (
              <>
                <ButtonLink href="/auth/register">회원가입</ButtonLink>
                <ButtonLink href="/auth/login" variant="muted">로그인</ButtonLink>
              </>
            )}
          </div>
          <div className="home-quick-grid" aria-label="주요 메뉴">
            <ButtonLink href="/marketplace?menu=sell">마켓플레이스</ButtonLink>
            <ButtonLink href="/notifications" variant="muted">알림센터</ButtonLink>
            <ButtonLink href="/my-page" variant="muted">내 활동</ButtonLink>
          </div>
        </div>

        <div className="home-side-panel">
          <div className="status-panel">
            <span className="status-label">현재 상태</span>
            <strong>{statusText}</strong>
            <p>{statusDescription}</p>
          </div>
          <div className="home-mini-list" aria-label="바로가기">
            <a href="/marketplace?menu=sell">
              <strong>마켓 둘러보기</strong>
              <span>판매글, 인기글, 지역 거래 확인</span>
            </a>
            <a href="/my-page?tab=chat">
              <strong>1:1 채팅방</strong>
              <span>거래 문의와 대화 관리</span>
            </a>
            <a href="/my-page?tab=keywords">
              <strong>키워드 알림</strong>
              <span>관심 단어 등록과 알림 설정</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
