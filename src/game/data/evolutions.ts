import type { CardId } from '@/game/types';

// Seção 17.6: nos níveis 10 e 20 a carta evolui e ganha um efeito, mais forte no 20.
export const EVOLUTION_LEVELS = [10, 20];

/** Evolução no nível: 0 (nenhuma), 1 (nível 10) ou 2 (nível 20). */
export function evolutionTier(level: number): number {
  return EVOLUTION_LEVELS.filter((l) => level >= l).length;
}

/** Valor do efeito em cada evolução [nível 10, nível 20]. O que cada número significa: */
export const EVOLUTIONS: Record<CardId, readonly [number, number]> = {
  sniper: [1, 2], // zumbis atrás do alvo que o tiro também atravessa
  sheriff: [3, 2], // a cada N tiros, um tiro extra
  shotgun: [1, 2], // zumbis a mais no estouro
  chainsaw: [0.2, 0.4], // fração do dano que vira vida
  dog: [0.3, 0.5], // quanto o zumbi mordido fica mais lento (por SLOW_DURATION)
  barricade: [6, 12], // dano devolvido a cada golpe recebido (x poder do nível)
  soldier: [0.15, 0.3], // ataque mais rápido
  firefighter: [2, 3], // segundos de fogo no chão onde acerta
  medic: [5, 10], // vida da base curada a cada pulso (x poder do nível)
  crossbow: [2, 4], // zumbis a mais que o virote atravessa
  turret: [10, 20], // segundos a mais em campo
  grenade: [1, 2], // segundos de atordoamento
  medkit: [0.05, 0.1], // fração da vida da base curada
  molotov: [2, 4], // segundos a mais de fogo
  airstrike: [1, 0.5], // atraso até cair, em segundos
  landmine: [0.2, 0.4], // raio a mais
  drone: [0.2, 0.4], // ataque mais rápido
  tesla: [1, 2], // pulos a mais do raio
  laser: [2, 4], // zumbis a mais que o raio atravessa
  titan: [20, 40], // empurrão a mais
  cryo: [0.5, 1], // segundos a mais de congelamento
  forcefield: [0.25, 0.5], // vida a mais da parede
  blackhole: [0.2, 0.4], // raio a mais
  orbital: [0.5, 0.25], // atraso até cair, em segundos
};

/** Valor do efeito da carta no nível, ou null antes da primeira evolução. */
export function evolutionValue(card: CardId, level: number): number | null {
  const tier = evolutionTier(level);
  return tier === 0 ? null : EVOLUTIONS[card][tier - 1];
}

/** Quanto tempo dura a lentidão da mordida do Rex. */
export const SLOW_DURATION = 2;
/** Mira: até onde, atrás do alvo, o tiro continua (e a largura da faixa). */
export const SNIPER_PIERCE = { depth: 140, width: 26 };
/** Bombeiro: fogo no chão onde acerta (raio e dano por segundo como fração do dano do tiro). */
export const GROUND_FIRE = { radius: 45, dpsPerDamage: 1.5 };
