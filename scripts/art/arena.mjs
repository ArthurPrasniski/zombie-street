// Arena de cada mundo (unidades do mundo, 600 x 900). O build gera um fundo por mundo.
import { drawCity } from './arenaCity.mjs';
import { drawDesert } from './arenaDesert.mjs';
import { drawFarm } from './arenaFarm.mjs';
import { ARENA_H, ARENA_W } from './arenaKit.mjs';
import { drawSnow } from './arenaSnow.mjs';
import { drawSwamp } from './arenaSwamp.mjs';
import { drawLab } from './arenaLab.mjs';
import { drawLaunch } from './arenaLaunch.mjs';
import { drawTech } from './arenaTech.mjs';
import { drawHive } from './arenaHive.mjs';
import { drawMars } from './arenaMars.mjs';
import { drawMoon } from './arenaMoon.mjs';
import { drawStation } from './arenaStation.mjs';

export { ARENA_H, ARENA_W };
export const ARENAS = { farm: drawFarm, city: drawCity, swamp: drawSwamp, desert: drawDesert, snow: drawSnow, tech: drawTech, lab: drawLab, launch: drawLaunch, station: drawStation, moon: drawMoon, mars: drawMars, hive: drawHive };
