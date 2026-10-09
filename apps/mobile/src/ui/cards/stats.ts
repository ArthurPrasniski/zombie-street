import { cardPower } from '@/game/data/balance';
import { CARDS, isTroop } from '@/game/data/cards';
import { evolutionValue } from '@/game/data/evolutions';
import type { CardId } from '@/game/types';
import { pt } from '@/i18n/pt';

export interface CardStat {
  label: string;
  value: number;
  suffix?: string;
  /** false: não muda com o nível (alcance, área, duração). */
  grows: boolean;
}

const fixed = (label: string, value: number, suffix?: string): CardStat => ({ label, value, suffix, grows: false });

/** Atributos da carta no nível dado (o que o modal de melhoria compara). */
export function cardStats(card: CardId, level: number): CardStat[] {
  const def = CARDS[card];
  const power = cardPower(level);
  const up = (label: string, base: number, suffix?: string): CardStat => ({ label, value: Math.round(base * power), suffix, grows: true });
  const s = pt.cards;
  if (isTroop(def)) {
    const stats = [up(s.hp, def.hp)];
    if (def.damage > 0) stats.push(up(s.damage, def.damage));
    if (def.heal) stats.push(up(s.healPulse, def.heal));
    if (def.range > 0) stats.push(fixed(s.range, def.range));
    if (def.lifetime) stats.push(fixed(s.duration, def.lifetime, ' s'));
    return stats;
  }
  switch (def.id) {
    case 'medkit':
      return [up(s.heal, (def.heal ?? 0) * 100, '%'), fixed(s.area, def.radius)];
    case 'molotov':
      return [up(s.dps, def.dps ?? 0), fixed(s.duration, def.duration ?? 0, ' s'), fixed(s.area, def.radius)];
    case 'forcefield':
      return [up(s.hp, def.wallHp ?? 0), fixed(s.duration, def.duration ?? 0, ' s')];
    default:
      return [up(s.damage, def.damage ?? 0), fixed(s.area, def.radius)];
  }
}

/** Frase da carta com os números do nível (armas especiais) ou o papel dela (tropas). */
export function cardDescription(card: CardId, level: number): string {
  const def = CARDS[card];
  const power = cardPower(level);
  const d = pt.cards.descriptions;
  switch (def.id) {
    case 'grenade':
      return d.grenade(Math.round((def.damage ?? 0) * power));
    case 'medkit':
      return d.medkit(Math.round((def.heal ?? 0) * power * 100));
    case 'molotov':
      return d.molotov(Math.round((def.dps ?? 0) * power), def.duration ?? 0);
    case 'airstrike':
      return d.airstrike(Math.round((def.damage ?? 0) * power));
    case 'landmine':
      return d.landmine(Math.round((def.damage ?? 0) * power));
    case 'cryo':
      return d.cryo(Math.round((def.damage ?? 0) * power));
    case 'forcefield':
      return d.forcefield(Math.round((def.wallHp ?? 0) * power));
    case 'blackhole':
      return d.blackhole(Math.round((def.damage ?? 0) * power));
    case 'orbital':
      return d.orbital(Math.round((def.damage ?? 0) * power));
    default:
      return d[def.id];
  }
}

const pct = (ratio: number) => `${Math.round(ratio * 100)}%`;
const decimal = (n: number) => String(n).replace('.', ',');

/** Efeito da evolução da carta no nível dado (GDD seção 17.6), ou null se ainda não evoluiu. */
export function evolutionText(card: CardId, level: number): string | null {
  const v = evolutionValue(card, level);
  if (v === null) return null;
  const e = pt.cards.evolutions;
  const scaled = Math.round(v * cardPower(level));
  switch (card) {
    case 'chainsaw':
    case 'dog':
    case 'soldier':
    case 'medkit':
    case 'landmine':
    case 'drone':
    case 'forcefield':
    case 'blackhole':
      return e[card](pct(v));
    case 'firefighter':
    case 'grenade':
    case 'airstrike':
    case 'cryo':
    case 'orbital':
      return e[card](decimal(v));
    case 'barricade':
    case 'medic':
      return e[card](scaled);
    default:
      return e[card](v);
  }
}
