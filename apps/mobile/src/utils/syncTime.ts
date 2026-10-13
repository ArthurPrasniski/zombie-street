import { t } from '@/i18n';
import { formatDate } from '@/utils/format';

/** Hermes não oferece Intl.RelativeTimeFormat; usamos as traduções do app. */
export function formatSyncTime(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null;
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const minutes = Math.max(0, Math.round((now - timestamp) / 60000));
  if (minutes === 0) return t.account.justNow;
  if (minutes < 60) return t.account.minutesAgo(minutes);
  return formatDate(iso);
}
