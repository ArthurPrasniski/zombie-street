// Notificações (GDD seção 20): avisos locais na voz do rádio, a pergunta da permissão e a seção
// de Ajustes. Os avisos remotos (compra, cobrança, temporada) o servidor escreve.

import { en as pt } from '@/i18n/en';

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);
const radio = (speaker: 'sheriff' | 'sniper' | 'vega') => `📻 ${pt.radio.speakers[speaker]}`;

export interface PushText {
  title: string;
  body: string;
}

export const enPush = {
  channel: "Radio alerts",
  comeback: {
    1: (stage: string): PushText => ({ title: radio('sheriff'), body: `Stage ${stage} is waiting. The horde will not stop itself.` }),
    3: (world: string): PushText => ({ title: radio('sniper'), body: `You have been off the radio for a few days. ${world} still needs you.` }),
    7: (stage: string): PushText => ({ title: radio('vega'), body: `The spores are spreading. Back to the road: stage ${stage}.` }),
  },
  upgrade: (card: string, level: number): PushText => ({ title: "Upgrade available", body: `You can upgrade ${card} to level ${level}. You already have the coins.` }),
  passRewards: (n: number): PushText => ({ title: "Pass rewards", body: `${plural(n, "reward waiting", "rewards waiting")} in the Battle Pass.` }),
  seasonEnd: (days: number, n: number): PushText => ({
    title: days === 1 ? "The season ends tomorrow" : "The season is ending",
    body: `${days === 1 ? "Tomorrow" : `In ${days} days`} the Pass resets. You have ${plural(n, "reward", "rewards")} to claim.`,
  }),
  dailyReset: (): PushText => ({ title: "A new day on the road", body: "Pass XP and coin doubles are back. Ready to play?" }),
  survival: (best: number): PushText => ({ title: radio('sheriff'), body: `You stopped at wave ${best} in Survival. Can you handle wave ${best + 1}?` }),

  prompt: {
    title: "Radio alerts",
    body: "Want radio alerts for card upgrades, Pass rewards or when the road misses you? At most one alert a day, between 9 AM and 9 PM.",
    yes: "Enable alerts",
    no: "Not now",
  },

  settings: {
    section: "Notifications",
    off: "Notifications off",
    offHint: "Enable to receive radio alerts.",
    enable: "Enable",
    openSystem: "Open",
    deniedHint: "Allow Zombie Road notifications in your device settings.",
    progress: "Progress",
    progressHint: "Return to the road, upgrades and Survival records.",
    pass: "Battle Pass",
    passHint: "Waiting rewards and season start and end.",
    shop: "Purchases",
    shopHint: "Purchase confirmations and Pass payment issues.",
    news: "News",
    newsHint: "New worlds and events.",
  },
};
