"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

import type { MarketplaceMenu } from "@/features/marketplace/model/marketplace.model";
import { useLanguage } from "@/hooks/useLanguage";
import { translate, translateMarketValue } from "@/lib/i18n";

export const primaryMarketCategories = [
  { label: "개인판매", icon: "bag" },
  { label: "개인구매", icon: "search" },
  { label: "무료나눔", icon: "gift" },
  { label: "업체판매", icon: "store" },
  { label: "공동구매", icon: "users" },
  { label: "북마크", icon: "bookmark" },
  { label: "내 판매글", icon: "box" },
] as const;

type MarketplaceSidebarProps = {
  activeMenu?: string;
  collapsed?: boolean;
  mobileDrawer?: boolean;
  onSelect?: (label: MarketplaceMenu) => void;
  onToggleCollapse?: () => void;
};

export function MarketplaceSidebar({
  activeMenu = "개인판매",
  collapsed = false,
  mobileDrawer = false,
  onSelect,
  onToggleCollapse,
}: MarketplaceSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const sidebar = (
    <aside
      className={[
        "market-sidebar",
        isOpen ? "open" : "",
        collapsed ? "collapsed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={translate(language, "market.menu")}
    >
      <div className="market-sidebar__head">
        <div>
          <span>MARKET</span>
          <h1>{translate(language, "market.title")}</h1>
        </div>
        {onToggleCollapse ? (
          <button
            aria-label={collapsed ? translate(language, "market.expand") : translate(language, "market.collapse")}
            aria-pressed={collapsed}
            className="market-sidebar-collapse"
            onClick={onToggleCollapse}
            type="button"
          >
            <span className="market-sidebar-collapse-icon" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <nav className="market-menu">
        {primaryMarketCategories.map((category) => {
          const isActive = activeMenu === category.label;

          if (!onSelect) {
            return (
              <Link
                className={isActive ? "active" : ""}
                href={`/marketplace?menu=${getMarketCategorySlug(category.label)}`}
                key={category.label}
                onClick={() => setIsOpen(false)}
              >
                <MarketIcon name={category.icon} />
                <span>{translateMarketValue(language, category.label)}</span>
              </Link>
            );
          }

          return (
            <button
              className={isActive ? "active" : ""}
              key={category.label}
              onClick={() => {
                onSelect(category.label);
                setIsOpen(false);
              }}
              type="button"
            >
              <MarketIcon name={category.icon} />
              <span>{translateMarketValue(language, category.label)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );

  if (!mobileDrawer) {
    return sidebar;
  }

  return (
    <div className="market-sidebar-shell">
      <button
        aria-expanded={isOpen}
        className="market-sidebar-toggle"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="market-sidebar-toggle-icon" aria-hidden="true">
          <span />
        </span>
        <span className="sr-only">{translate(language, "market.toggle")}</span>
      </button>
      {sidebar}
    </div>
  );
}

function getMarketCategorySlug(label: string) {
  if (label === "개인구매") return "buy";
  if (label === "무료나눔") return "free";
  if (label === "업체판매") return "business";
  if (label === "공동구매") return "group";
  if (label === "북마크") return "bookmarks";
  if (label === "내 판매글") return "my-posts";
  return "sell";
}

function MarketIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    bag: <path d="M7 9h10l-.7 10H7.7L7 9Zm2-2a3 3 0 0 1 6 0" />,
    search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>,
    gift: <><path d="M4 10h16v10H4zM4 10V7h16v3M12 7v13M8 7c-2-3 2.5-4 4 0M16 7c2-3-2.5-4-4 0" /></>,
    store: <><path d="M4 10h16l-1.5-5h-13L4 10Zm2 0v9h12v-9" /><path d="M9 19v-5h6v5" /></>,
    users: <><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M3.5 19c.7-3 2.5-5 4.5-5s3.8 2 4.5 5M11.5 19c.7-3 2.5-5 4.5-5s3.8 2 4.5 5" /></>,
    trend: <path d="M4 16 9 11l4 4 7-8M15 7h5v5" />,
    bookmark: <path d="M7 4h10v16l-5-3-5 3V4Z" />,
    box: <><path d="m4 8 8-4 8 4-8 4-8-4Zm0 0v8l8 4 8-4V8" /><path d="M12 12v8" /></>,
  };

  return (
    <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        {paths[name]}
      </g>
    </svg>
  );
}
