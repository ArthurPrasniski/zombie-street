import { localeTag } from '@/i18n/locale';

const SUFFIXES = ['', 'K', 'M', 'B', 'T'];

/** 999 -> "999", 1234 -> "1.2K", 3400000 -> "3.4M". Trunca para nunca mostrar mais do que existe. */
export function formatCash(value: number): string {
  const v = Math.floor(value);
  let tier = 0;
  while (tier < SUFFIXES.length - 1 && v >= 1000 ** (tier + 1)) tier++;
  if (tier === 0) return String(v);
  const tenths = Math.floor(v / (1000 ** tier / 10));
  return `${new Intl.NumberFormat(localeTag, { maximumFractionDigits: 1 }).format(tenths / 10)}${SUFFIXES[tier]}`;
}

/** Inteiro com ponto de milhar: 1150 -> "1.150", 12000 -> "12.000". */
export function formatInt(value: number): string {
  return new Intl.NumberFormat(localeTag, { maximumFractionDigits: 0 }).format(Math.round(value));
}

export const formatDecimal = (value: number, digits = 1): string => new Intl.NumberFormat(localeTag, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
export const formatMoney = (value: number, currency: string): string => new Intl.NumberFormat(localeTag, { style: 'currency', currency }).format(value);
export const formatDate = (value: string | Date): string => new Intl.DateTimeFormat(localeTag).format(new Date(value));
export const formatDateTime = (value: string | Date): string => new Intl.DateTimeFormat(localeTag, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

/** 45 -> "45 s", 754 -> "12 min", 5400 -> "1 h 30 min". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s} s`;
  const totalMinutes = Math.floor(s / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}
