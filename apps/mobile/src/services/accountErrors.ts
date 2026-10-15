import { t } from '@/i18n';
import { accountErrors } from '@/i18n/accountErrors';
import { ApiError } from '@/services/api';

/** Only expose bounded SDK/HTTP codes; never display raw errors, tokens or user data. */
export function accountErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status > 0) return accountErrors.http(error.status);
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code === '10' || code === 'DEVELOPER_ERROR') return accountErrors.google;
  if (/^[A-Z0-9_]{1,48}$/.test(code)) return accountErrors.native(code);
  return t.account.failed;
}
