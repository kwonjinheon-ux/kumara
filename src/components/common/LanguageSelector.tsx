"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { supportedLanguages, translate, type SupportedLanguage } from "@/lib/i18n";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const label = translate(language, "language.label");

  function updateLanguage(value: string) {
    setLanguage(value as SupportedLanguage);
  }

  return (
    <label className="main-language-control">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="main-language-select"
        onChange={(event) => updateLanguage(event.target.value)}
        onInput={(event) => updateLanguage(event.currentTarget.value)}
        value={language}
      >
        {supportedLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
