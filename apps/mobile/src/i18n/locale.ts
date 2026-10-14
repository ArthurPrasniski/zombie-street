// Native localization is optional for the deterministic server simulation.
function getLocales(): LocaleInfo[] {
  if (typeof process !== 'undefined' && process.versions?.node && process.env.NODE_ENV !== 'test') return [{ languageTag: 'pt-BR', languageCode: 'pt', regionCode: 'BR' }];
  // Conditional loading keeps Node simulations free of native modules.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try { return (require('expo-localization') as typeof import('expo-localization')).getLocales(); }
  catch { return [{ languageTag: 'en-US', languageCode: 'en', regionCode: 'US' }]; }
}

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
export let language = languageFor(deviceLocales);
export function selectLanguage(value: AppLanguage | 'auto') { language = value === 'auto' ? languageFor(deviceLocales) : value; localeTag = value === 'auto' ? deviceLocales[0]?.languageTag.replace(/_/g,'-') || 'en-US' : { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[value]; }
export let localeTag = deviceLocales[0]?.languageTag.replace(/_/g, '-') || 'en-US';
export const regionCode = deviceLocales[0]?.regionCode ?? localeTag.split('-').find((part) => /^[A-Z]{2}$/.test(part)) ?? null;
