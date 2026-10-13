import { getLocales } from 'expo-localization';

export type AppLanguage = 'pt' | 'en' | 'es';
type LocaleInfo = { languageTag: string; languageCode?: string | null; regionCode?: string | null };

/** Usa a primeira preferência de idioma disponível; inglês é o idioma de fallback. */
export function languageFor(locales: readonly LocaleInfo[]): AppLanguage {
  for (const locale of locales) {
    const language = (locale.languageCode ?? locale.languageTag.split(/[-_]/)[0]).toLowerCase();
    if (language === 'pt' || language === 'en' || language === 'es') return language;
  }
  return 'en';
}

export const deviceLocales = getLocales();
export const language = languageFor(deviceLocales);
export const localeTag = deviceLocales[0]?.languageTag.replace(/_/g, '-') || 'en-US';
export const regionCode = deviceLocales[0]?.regionCode ?? localeTag.split('-').find((part) => /^[A-Z]{2}$/.test(part)) ?? null;
