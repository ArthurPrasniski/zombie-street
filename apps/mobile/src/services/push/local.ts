import { PASS_DAILY_XP } from '@zombie-road/shared/pass';
import { pushData } from '@zombie-road/shared/push';

import { CARDS } from '@/game/data/cards';
import { stageLabel, worldOf } from '@/game/data/worlds';
import { type PlanInput, planLocalPushes } from '@/services/push/plan';
import { notifications, PUSH_CHANNEL, pushPermission } from '@/services/push/notifications';
import { doublesLeft } from '@/services/rewards';
import { useAccountStore } from '@/state/accountStore';
import { canUpgradeCard } from '@/state/progress';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { countClaimable } from '@/ui/pass/claimable';
import { worldName } from '@/ui/worldInfo';

// Avisos locais (GDD seção 20.1): ao sair do app, agenda o plano; ao voltar, cancela tudo.

/** O que o plano precisa saber, lido das stores agora. */
export function planInput(now: Date): PlanInput {
  const progress = useProgressStore.getState();
  const { pass } = useAccountStore.getState();
  const next = progress.highestCleared + 1;
  const card = progress.deck.find((id) => canUpgradeCard(progress, id));
  return {
    now,
    prefs: useSettingsStore.getState().push,
    stage: stageLabel(next),
    world: worldName(worldOf(next)),
    upgrade: card ? { card: CARDS[card].name, level: progress.cardLevels[card] + 1 } : null,
    passClaimable: pass ? countClaimable(pass) : 0,
    seasonEnd: pass ? new Date(pass.endsAt) : null,
    maxedToday: doublesLeft() <= 0 || (pass !== null && pass.xpToday >= PASS_DAILY_XP),
    survivalBest: progress.survivalBest,
  };
}

export async function cancelLocalPushes(): Promise<void> {
  await notifications()?.cancelAllScheduledNotificationsAsync();
}

/** Troca os avisos agendados pelo plano de agora. Sem permissão, não agenda nada. */
export async function scheduleLocalPushes(): Promise<void> {
  const N = notifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
  const plan = planLocalPushes(planInput(new Date()));
  if (__DEV__) console.log(`[push] plano local: ${plan.map((p) => `${p.at.toLocaleString('pt-BR')} ${p.kind}`).join(' | ') || 'nada'}`);
  if ((await pushPermission()) !== 'granted') return;
  for (const push of plan) {
    await N.scheduleNotificationAsync({
      content: { title: push.title, body: push.body, data: { ...pushData(push.kind) }, sound: 'default' },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: push.at, channelId: PUSH_CHANNEL },
    });
  }
}
