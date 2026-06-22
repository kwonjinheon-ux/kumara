"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { translate } from "@/lib/i18n";

type LocalizedTextProps = {
  textKey: Parameters<typeof translate>[1];
  values?: Record<string, string | number>;
};

export function LocalizedText({ textKey, values }: LocalizedTextProps) {
  const { language } = useLanguage();

  return <>{translate(language, textKey, values)}</>;
}
