import type { MembershipState } from '@zombie-road/shared/api';
import { useAccountStore } from '@/state/accountStore';
import { useProgressStore } from '@/state/progressStore';

export function membershipActive(membership: MembershipState | null, userId: string | undefined, now: number): boolean {
  return !!membership?.active && membership.userId === userId && !!membership.expiresAt && Date.parse(membership.expiresAt) > now;
}

/** A validade salva permite jogar offline até o fim do período já confirmado. */
export function adsRemoved(): boolean {
  const { membership, user } = useAccountStore.getState();
  return membershipActive(membership, user?.id, Date.now());
}

export function syncMembershipCoins(): void {
  const { membership, user } = useAccountStore.getState();
  if (!membership || membership.userId !== user?.id) return;
  for (const grant of membership.grants) useProgressStore.getState().grantMembership(grant);
}
