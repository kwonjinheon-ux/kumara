"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/hooks/useLanguage";
import { translate } from "@/lib/i18n";

const MARKETPLACE_SEARCH_EVENT = "kumara:marketplace-search";

export function MainSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchUrlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { language } = useLanguage();
  const searchLabel = translate(language, "search.label");

  useEffect(() => {
    if (!pathname.startsWith("/marketplace")) return;
    setQuery(searchParams.get("q") ?? "");
  }, [pathname, searchParams]);

  useEffect(() => {
    return () => {
      if (searchPulseTimer.current) {
        clearTimeout(searchPulseTimer.current);
      }
      if (searchUrlTimer.current) {
        clearTimeout(searchUrlTimer.current);
      }
    };
  }, []);

  function triggerSearchPulse() {
    setIsSearchActive(true);
    if (searchPulseTimer.current) {
      clearTimeout(searchPulseTimer.current);
    }
    searchPulseTimer.current = setTimeout(() => {
      setIsSearchActive(false);
      searchPulseTimer.current = null;
    }, 360);
  }

  function getMarketplaceSearchUrl(nextQuery: string) {
    if (!pathname.startsWith("/marketplace")) return;

    const params = new URLSearchParams(window.location.search);
    const normalizedQuery = nextQuery.trim();

    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    } else {
      params.delete("q");
    }

    const queryString = params.toString();
    return `/marketplace${queryString ? `?${queryString}` : ""}`;
  }

  function dispatchMarketplaceSearch(nextQuery: string) {
    if (!pathname.startsWith("/marketplace")) return;

    window.dispatchEvent(
      new CustomEvent(MARKETPLACE_SEARCH_EVENT, {
        detail: { query: nextQuery.trim() },
      }),
    );
  }

  function syncMarketplaceSearchUrl(nextQuery: string) {
    if (searchUrlTimer.current) {
      clearTimeout(searchUrlTimer.current);
    }

    const nextUrl = getMarketplaceSearchUrl(nextQuery);
    if (!nextUrl) return;

    searchUrlTimer.current = setTimeout(() => {
      router.replace(nextUrl, { scroll: false });
      searchUrlTimer.current = null;
    }, 180);
  }

  function onQueryChange(value: string) {
    setQuery(value);
    dispatchMarketplaceSearch(value);
    syncMarketplaceSearchUrl(value);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    triggerSearchPulse();

    if (searchUrlTimer.current) {
      clearTimeout(searchUrlTimer.current);
      searchUrlTimer.current = null;
    }

    dispatchMarketplaceSearch(query);
    const nextUrl = getMarketplaceSearchUrl(query);
    router.push(nextUrl ?? "/marketplace", { scroll: false });
  }

  return (
    <form className="main-search-shell" onSubmit={onSubmit} role="search">
      <label className="main-search">
        <span className="sr-only">{searchLabel}</span>
        <input
          onChange={(event) => onQueryChange(event.target.value)}
          onInput={(event) => onQueryChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              triggerSearchPulse();
            }
          }}
          placeholder=""
          type="search"
          value={query}
        />
      </label>
      <button aria-label={searchLabel} className={`main-ask-button${isSearchActive ? " is-searching" : ""}`} type="submit">
        <SearchActionIcon />
      </button>
    </form>
  );
}

function SearchActionIcon() {
  return (
    <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
      <circle cx="10.8" cy="10.8" r="5.8" stroke="currentColor" strokeWidth="2" />
      <path d="m15.4 15.4 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}
