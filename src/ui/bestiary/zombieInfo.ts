import { SPECIAL_ZOMBIES } from '@/game/data/stages';
import { stageLabel, WORLDS } from '@/game/data/worlds';
import { ZOMBIES } from '@/game/data/zombies';
import type { ZombieId } from '@/game/types';
import { pt } from '@/i18n/pt';

/** Retratos do Bestiário (gerados por scripts/art/portraits.mjs). */
export const ZOMBIE_ART: Record<ZombieId, number> = {
  walker: require('@/assets/images/bestiary/walker.png'),
  runner: require('@/assets/images/bestiary/runner.png'),
  brute: require('@/assets/images/bestiary/brute.png'),
  cop: require('@/assets/images/bestiary/cop.png'),
  riot: require('@/assets/images/bestiary/riot.png'),
  bloater: require('@/assets/images/bestiary/bloater.png'),
  hulk: require('@/assets/images/bestiary/hulk.png'),
  grunt: require('@/assets/images/bestiary/grunt.png'),
  general: require('@/assets/images/bestiary/general.png'),
  frost: require('@/assets/images/bestiary/frost.png'),
  yeti: require('@/assets/images/bestiary/yeti.png'),
  spitter: require('@/assets/images/bestiary/spitter.png'),
  digger: require('@/assets/images/bestiary/digger.png'),
  splitter: require('@/assets/images/bestiary/splitter.png'),
  splitling: require('@/assets/images/bestiary/splitling.png'),
  shielder: require('@/assets/images/bestiary/shielder.png'),
  android: require('@/assets/images/bestiary/android.png'),
  mutant: require('@/assets/images/bestiary/mutant.png'),
  astronaut: require('@/assets/images/bestiary/astronaut.png'),
  colossus: require('@/assets/images/bestiary/colossus.png'),
  director: require('@/assets/images/bestiary/director.png'),
  padChief: require('@/assets/images/bestiary/padChief.png'),
  cosmonaut: require('@/assets/images/bestiary/cosmonaut.png'),
  xeno: require('@/assets/images/bestiary/xeno.png'),
  pod: require('@/assets/images/bestiary/pod.png'),
  larva: require('@/assets/images/bestiary/larva.png'),
  commander: require('@/assets/images/bestiary/commander.png'),
  lunarWorm: require('@/assets/images/bestiary/lunarWorm.png'),
  marsTitan: require('@/assets/images/bestiary/marsTitan.png'),
  queen: require('@/assets/images/bestiary/queen.png'),
};

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
  return ids;
})();

/** Onde o zumbi aparece. */
export function zombieWhere(id: ZombieId): string {
  const b = pt.bestiary;
  if (id === 'walker' || id === 'runner') return b.everywhere;
  const w = WORLDS.findIndex((world) => world.zombie === id);
  if (w >= 0) return b.worldZombie(w + 1, WORLDS[w].name);
  const boss = WORLDS.findIndex((world) => world.boss === id);
  if (boss >= 0) return b.worldBoss(boss + 1, WORLDS[boss].name);
  const special = SPECIAL_ZOMBIES.find((e) => e.zombie === id);
  return special ? b.fromStage(stageLabel(special.from)) : b.fromSplitter;
}
