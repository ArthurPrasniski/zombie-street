import type { MembershipGrant } from '@zombie-road/shared/api';
import type { Progress } from './progress';

/** Saldo e recibo mudam juntos; reabrir o app ou restaurar o save não duplica moedas. */
export function membershipReward(p: Progress, grant: MembershipGrant): Progress {
  const id = `membership:${grant.id}`;
  const refundId = `${id}:refund`;
  const applied = p.membershipRewards.includes(id);
  if (grant.refunded) {
    if (p.membershipRewards.includes(refundId)) return p;
    return { ...p, cash: Math.max(0, p.cash - (applied ? grant.coins : 0)), membershipRewards: [...p.membershipRewards, ...(!applied ? [id] : []), refundId] };
  }
  if (applied) return p;
  return { ...p, cash: p.cash + grant.coins, membershipRewards: [...p.membershipRewards, id] };
}
