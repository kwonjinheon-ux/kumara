"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { translateMarketValue } from "@/lib/i18n";

type LocalizedMarketValueProps = {
  value: string;
};

export function LocalizedMarketValue({ value }: LocalizedMarketValueProps) {
  const { language } = useLanguage();

  return <>{translateMarketValue(language, value)}</>;
}
