import { useEffect, useState } from 'react';

import { membershipActive } from '@/services/membership';
import { useAccountStore } from '@/state/accountStore';

/** Atualiza a interface na expiração, inclusive se o app permanecer aberto. */
export function useMembershipActive(): boolean {
  const membership = useAccountStore((s) => s.membership);
  const userId = useAccountStore((s) => s.user?.id);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!membership?.expiresAt) return;
    const remaining = Date.parse(membership.expiresAt) - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(remaining + 1, 2147483647));
    return () => clearTimeout(timer);
  }, [membership, now]);
  return membershipActive(membership, userId, now);
}
