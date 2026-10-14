import { selectLanguage, type AppLanguage } from './locale';
/** Game definitions may be frozen by worklets. Only UI labels follow this preference. */
export function applyAppLanguage(value: AppLanguage | 'auto') { selectLanguage(value); }
