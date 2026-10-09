import type { PassState } from '@shared/api';
import { canClaim, PASS_TIERS } from '@shared/pass';

/** Prêmios do passe que já dá para resgatar (nas duas trilhas). */
export function countClaimable(pass: PassState): number {
  let n = 0;
  for (let tier = 1; tier <= PASS_TIERS; tier++) {
    if (canClaim(pass.xp, tier, 'free', pass.claimedFree, pass.premium)) n++;
    if (canClaim(pass.xp, tier, 'premium', pass.claimedPremium, pass.premium)) n++;
  }
  return n;
}
