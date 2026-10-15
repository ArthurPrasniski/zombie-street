import { localizedName } from '@/i18n/names';
import { SPECIAL_ZOMBIES } from '@/game/data/stages';
import { stageLabel, WORLDS } from '@/game/data/worlds';
import { ZOMBIES } from '@/game/data/zombies';
import type { ZombieId } from '@/game/types';
import { t as pt } from '@/i18n';
import {DETAILED_ZOMBIE_ART} from '@/ui/pixel16/productionPortraits';

/** Retratos do Bestiário (arte RPG detalhada). */
export const ZOMBIE_ART: Record<ZombieId, number> = DETAILED_ZOMBIE_ART;

/** Ordem do Bestiário: comuns, depois zumbi e chefe de cada mundo, depois os especiais. */
export const BESTIARY_ORDER: ZombieId[] = (() => {
  const ids: ZombieId[] = ['walker', 'runner'];
  for (const world of WORLDS) {
    if (world.zombie) ids.push(world.zombie);
    ids.push(world.boss);
  }
  for (const { zombie } of SPECIAL_ZOMBIES) {
    ids.push(zombie);
    const into = ZOMBIES[zombie].split?.into;
    if (into) ids.push(into);
  }
  return [...new Set([...ids, ...(Object.keys(ZOMBIES) as ZombieId[])])];
})();

/** Onde o zumbi aparece. */
export function zombieWhere(id: ZombieId): string {
  const b = pt.bestiary;
  if(id==='larva')return b.fromPod;
  if (id === 'walker' || id === 'runner') return b.everywhere;
  const w = WORLDS.findIndex((world) => world.zombie === id);
  if (w >= 0) return b.worldZombie(w + 1, localizedName(WORLDS[w].name));
  const boss = WORLDS.findIndex((world) => world.boss === id);
  if (boss >= 0) return b.worldBoss(boss + 1, localizedName(WORLDS[boss].name));
  const special = SPECIAL_ZOMBIES.find((e) => e.zombie === id);
  return special ? b.fromStage(stageLabel(special.from)) : b.fromSplitter;
}
