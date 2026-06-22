"use client";

import Image from "next/image";
import { Suspense } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { MainSearch } from "@/components/common/MainSearch";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { LocalizedText } from "@/components/common/LocalizedText";
import colinkLogo from "../../../logo/colink_logo.png";

export function MainNavbar() {
  const { firebaseUser, logout, profile } = useAuth();
  const displayName = profile?.displayName ?? firebaseUser?.displayName ?? firebaseUser?.email?.split("@")[0] ?? "";
  const photoURL = profile?.photoURL ?? firebaseUser?.photoURL ?? null;

  async function onLogout() {
    await logout();
    window.location.assign("/");
  }

  return (
    <header className="main-navbar" aria-label="Kumara main navigation">
      <a className="main-brand" href="/" aria-label="Kumara 홈">
        <Image className="main-brand-logo" src={colinkLogo} alt="" priority />
        Kumara
      </a>
      <Suspense fallback={<div className="main-search" />}>
        <MainSearch />
      </Suspense>
      <nav className="main-actions" aria-label="주요 작업">
        <LanguageSelector />
        <a aria-label="알림" className="main-icon-button notification" href="/notifications">
          <BellIcon />
        </a>
        {firebaseUser ? (
          <details className="main-account-menu">
            <summary className="main-profile-button" aria-label="계정 메뉴">
              {photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={`${displayName} 프로필`} src={photoURL} />
              ) : (
                <span>{displayName.slice(0, 2).toUpperCase()}</span>
              )}
            </summary>
            <div className="main-account-popover" role="menu">
              <a className="main-account-home-link" href="/my-page" role="menuitem">
                <LocalizedText textKey="nav.myPage" />
              </a>
              <div className="main-account-category-links" aria-label="내 페이지 카테고리">
                <a href="/my-page?tab=profile" role="menuitem"><LocalizedText textKey="nav.profile" /></a>
                <a href="/my-page?tab=posts" role="menuitem"><LocalizedText textKey="nav.myPosts" /></a>
                <a href="/my-page?tab=comments" role="menuitem"><LocalizedText textKey="nav.myComments" /></a>
                <a href="/my-page?tab=bookmarks" role="menuitem"><LocalizedText textKey="nav.bookmarks" /></a>
                <a href="/my-page?tab=chat" role="menuitem"><LocalizedText textKey="nav.chat" /></a>
                <a href="/my-page?tab=keywords" role="menuitem"><LocalizedText textKey="nav.keywordAlerts" /></a>
                <a href="/my-page?tab=security" role="menuitem"><LocalizedText textKey="nav.security" /></a>
                <a href="/my-page?tab=membership" role="menuitem"><LocalizedText textKey="nav.membership" /></a>
              </div>
              <button onClick={() => void onLogout()} role="menuitem" type="button">
                <LocalizedText textKey="nav.logout" />
              </button>
            </div>
          </details>
        ) : (
          <div className="main-auth-links" aria-label="계정 메뉴">
            <a className="main-login-link" href="/auth/login"><LocalizedText textKey="nav.login" /></a>
            <a className="main-signup-link" href="/auth/register"><LocalizedText textKey="nav.signup" /></a>
          </div>
        )}
      </nav>
    </header>
  );
}

function BellIcon() {
  return (
    <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
      <path d="M18.5 10.2a6.5 6.5 0 0 0-13 0v3.1l-1.7 3.2h16.4l-1.7-3.2v-3.1Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M9.7 19.2a2.5 2.5 0 0 0 4.6 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}
