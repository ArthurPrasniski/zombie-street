import { en } from './en';
import { enPush } from './enPush';
import { es } from './es';
import { esPush } from './esPush';
import { language } from './locale';
import { pt } from './pt';
import { ptPush } from './ptPush';

export { language, localeTag, regionCode } from './locale';
type DictionaryShape<T> = T extends (...args: infer Args) => string
  ? (...args: Args) => string
  : T extends object ? { [K in keyof T]: DictionaryShape<T[K]> } : T;
export const dictionaries = { pt, en, es } satisfies Record<typeof language, DictionaryShape<typeof pt>>;
export const t = new Proxy({} as DictionaryShape<typeof pt>, { get: (_target, key) => dictionaries[language][key as keyof typeof pt] });
export const pushText = new Proxy({} as DictionaryShape<typeof ptPush>, { get: (_target, key) => ({ pt: ptPush, en: enPush, es: esPush })[language][key as keyof typeof ptPush] });
