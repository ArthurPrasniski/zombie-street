import { worldDef } from '@/game/data/worlds';
import { ZOMBIES } from '@/game/data/zombies';
import { pt } from '@/i18n/pt';

/** Nome do mundo para a tela; na Fronteira, o planeta e o tema (ex.: "Planeta de Lava · Tóxico"). */
export function worldName(w: number): string {
  const def = worldDef(w);
  return 'theme' in def ? pt.frontier.name(def.name, pt.frontier.themes[def.theme]) : def.name;
}

/** Na Fronteira, a ameaça e o chefe mutado (ex.: "Enxame · Chefe: General Gigante"); senão, null. */
export function worldDetails(w: number): string | null {
  const def = worldDef(w);
  if (!('threat' in def)) return null;
  return pt.frontier.details(pt.frontier.threats[def.threat], ZOMBIES[def.boss].name, pt.frontier.mutations[def.mutation]);
}

/** Tom de cor do planeta da Fronteira por cima do cenário (null nos mundos da campanha). */
export function worldTint(w: number): string | null {
  const def = worldDef(w);
  return 'planet' in def ? PLANET_TINTS[def.planet] : null;
}

const PLANET_TINTS = { ice: 'rgba(127, 208, 255, 0.28)', lava: 'rgba(255, 90, 31, 0.3)', jungle: 'rgba(79, 216, 106, 0.26)', crystal: 'rgba(200, 122, 255, 0.28)' };
