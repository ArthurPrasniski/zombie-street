import { type LocalPushKind, PUSH_HOURS, type PushPrefs } from '@zombie-road/shared/push';

import { ptPush, type PushText } from '@/i18n/ptPush';

// Plano dos avisos locais (GDD seção 20.1), feito quando o jogador sai do app. Função pura: o
// horário vem do relógio do aparelho (hora local). Regras: no máximo 1 aviso por dia, só entre 9h
// e 21h, nada na primeira hora. Quando dois avisos caem no mesmo dia, fica o mais importante.

export interface PlanInput {
  now: Date;
  prefs: PushPrefs;
  /** Próxima fase ("2-4") e o nome do mundo dela. */
  stage: string;
  world: string;
  /** Carta do deck que já dá para melhorar (nome e o nível que ela alcança), ou null. */
  upgrade: { card: string; level: number } | null;
  /** Prêmios do passe para resgatar (0 sem dados do passe). */
  passClaimable: number;
  /** Fim da temporada do passe, ou null sem dados do passe. */
  seasonEnd: Date | null;
  /** Hoje o jogador bateu o teto de XP do passe ou usou todos os "assista e dobre". */
  maxedToday: boolean;
  /** Recorde de ondas da Sobrevivência (0 = nunca jogou). */
  survivalBest: number;
}

export interface PlannedPush extends PushText {
  kind: LocalPushKind;
  at: Date;
}

const DAY_MS = 24 * 3600 * 1000;
const MIN_LEAD_MS = 3600 * 1000;
/** Dias sem jogar em que o rádio chama de volta. */
const COMEBACK_DAYS = [1, 3, 7] as const;
/** Avisos do fim da temporada: dias antes do fim, às 18h. */
const SEASON_WARNINGS = [3, 1];
const SEASON_WARNING_HOUR = 18;
/** Avisos especiais (prêmios, melhoria, dia novo) ocupam os dias 1 e 2. */
const SPECIAL_DAYS = 2;

/** O mesmo horário daqui a `days` dias, puxado para dentro da janela do dia (9h às 21h). */
export function slotTime(now: Date, days: number): Date {
  const at = new Date(now);
  at.setDate(at.getDate() + days);
  if (at.getHours() < PUSH_HOURS.start) at.setHours(PUSH_HOURS.start, 0, 0, 0);
  else if (at.getHours() >= PUSH_HOURS.end) at.setHours(PUSH_HOURS.end - 1, 0, 0, 0);
  return at;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function planLocalPushes(input: PlanInput): PlannedPush[] {
  const { now, prefs } = input;
  const byDay = new Map<string, PlannedPush>();
  // Em ordem de importância: quem entra depois no mesmo dia toma o lugar
  const put = (kind: LocalPushKind, at: Date, text: PushText) => {
    if (at.getTime() - now.getTime() >= MIN_LEAD_MS) byDay.set(dayKey(at), { kind, at, ...text });
  };

  if (prefs.progress) {
    put('comeback', slotTime(now, COMEBACK_DAYS[0]), ptPush.comeback[1](input.stage));
    if (input.survivalBest > 0) put('survival', slotTime(now, COMEBACK_DAYS[1]), ptPush.survival(input.survivalBest));
    else put('comeback', slotTime(now, COMEBACK_DAYS[1]), ptPush.comeback[3](input.world));
    put('comeback', slotTime(now, COMEBACK_DAYS[2]), ptPush.comeback[7](input.stage));
  }

  const specials: [LocalPushKind, PushText][] = [];
  if (prefs.pass && input.passClaimable > 0) specials.push(['passRewards', ptPush.passRewards(input.passClaimable)]);
  if (prefs.progress && input.upgrade) specials.push(['upgrade', ptPush.upgrade(input.upgrade.card, input.upgrade.level)]);
  if (prefs.progress && input.maxedToday) specials.push(['dailyReset', ptPush.dailyReset()]);
  specials.slice(0, SPECIAL_DAYS).forEach(([kind, text], i) => put(kind, slotTime(now, i + 1), text));

  if (prefs.pass && input.passClaimable > 0 && input.seasonEnd) {
    for (const days of SEASON_WARNINGS) {
      const at = new Date(input.seasonEnd.getTime() - days * DAY_MS);
      at.setHours(SEASON_WARNING_HOUR, 0, 0, 0);
      if (at < input.seasonEnd) put('seasonEnd', at, ptPush.seasonEnd(days, input.passClaimable));
    }
  }

  return [...byDay.values()].sort((a, b) => a.at.getTime() - b.at.getTime());
}
