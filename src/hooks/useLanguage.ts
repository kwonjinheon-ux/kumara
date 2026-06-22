"use client";

import { useEffect, useState } from "react";

import {
  isSupportedLanguage,
  languageChangeEvent,
  languageStorageKey,
  type SupportedLanguage,
} from "@/lib/i18n";

function readSavedLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "ko";

  const savedLanguage = window.localStorage.getItem(languageStorageKey);
  return isSupportedLanguage(savedLanguage) ? savedLanguage : "ko";
}

export function useLanguage() {
  const [language, setLanguage] = useState<SupportedLanguage>("ko");

  useEffect(() => {
    const savedLanguage = readSavedLanguage();
    document.documentElement.lang = savedLanguage;
    setLanguage(savedLanguage);

    function syncLanguage() {
      const nextLanguage = readSavedLanguage();
      document.documentElement.lang = nextLanguage;
      setLanguage(nextLanguage);
    }

    window.addEventListener(languageChangeEvent, syncLanguage);
    window.addEventListener("storage", syncLanguage);

    return () => {
      window.removeEventListener(languageChangeEvent, syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  return { language, setLanguage: setLanguagePreference };
}

export function setLanguagePreference(language: SupportedLanguage) {
  if (typeof window === "undefined") return;

  document.documentElement.lang = language;
  window.localStorage.setItem(languageStorageKey, language);
  window.dispatchEvent(new CustomEvent(languageChangeEvent, { detail: language }));
}
