"use client";

import { useState } from "react";

import { MarketplaceChatButton } from "@/components/marketplace/MarketplaceChatButton";
import type { MarketContactDisplay } from "@/types/marketplace";

type Props = {
  authorNickname: string;
  contacts: MarketContactDisplay[];
  isLoggedIn: boolean;
  postId: string;
  postTitle: string;
};

export function MarketplaceContactDropdown({ authorNickname, contacts, isLoggedIn, postId, postTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null);
  const summary = contacts.map((display) => getCompactContactLabel(display)).join(" · ");

  async function copyContact(display: MarketContactDisplay) {
    if (!display.value) return;

    try {
      await navigator.clipboard.writeText(display.value);
    } catch {
      const input = document.createElement("textarea");
      input.value = display.value;
      input.setAttribute("readonly", "");
      input.style.left = "-9999px";
      input.style.position = "fixed";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopiedMethod(display.method);
    window.setTimeout(() => setCopiedMethod((current) => (current === display.method ? null : current)), 1500);
  }

  return (
    <div className={`market-detail-contact-dropdown${open ? " open" : ""}`}>
      <button
        aria-expanded={open}
        className="market-detail-contact-dropdown__trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>연락방법</span>
        <strong>{summary}</strong>
      </button>

      {open ? (
        <div className="market-detail-contact-dropdown__panel">
          {contacts.map((display) => (
            <div className={`market-detail-contact-row method-${display.method}`} key={display.method}>
              {display.method === "korin_chat" ? (
                <MarketplaceChatButton
                  authorNickname={authorNickname}
                  isLoggedIn={isLoggedIn}
                  postId={postId}
                  postTitle={postTitle}
                />
              ) : display.method === "email" ? (
                <a className="market-detail-contact-action" href={`mailto:${display.value}`}>
                  이메일 보내기
                </a>
              ) : display.method === "phone" ? (
                <a className="market-detail-contact-action" href={`tel:${normalizePhoneHref(display.value)}`}>
                  전화걸기
                </a>
              ) : display.method === "kakao" ? (
                <button className="market-detail-contact-action" onClick={() => void copyContact(display)} type="button">
                  {copiedMethod === display.method ? "복사됨" : "카카오톡 복사"}
                </button>
              ) : (
                <b>{display.value}</b>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getCompactContactLabel(display: MarketContactDisplay) {
  if (display.method === "korin_chat") {
    return "1:1";
  }

  return display.label;
}

function normalizePhoneHref(value: string) {
  return value.replace(/[^\d+]/g, "");
}
