import type { ZombieDef, ZombieId } from '@/game/types';

// Seção 7
export const ZOMBIES: Record<ZombieId, ZombieDef> = {
  walker: { id: 'walker', name: 'Andarilho', hp: 40, speed: 35, damage: 8, attackInterval: 1.2, reward: 5, targetsTroops: true },
  runner: { id: 'runner', name: 'Corredor', hp: 24, speed: 80, damage: 6, attackInterval: 0.8, reward: 6, targetsTroops: true },
  brute: { id: 'brute', name: 'Brutamontes', hp: 650, speed: 20, damage: 30, attackInterval: 2.0, reward: 120, targetsTroops: false, isBoss: true, scale: 1.8 },
  // Mundo 2, Cidade: armadura desconta parte de cada golpe
  cop: { id: 'cop', name: 'Policial', hp: 60, speed: 30, damage: 9, attackInterval: 1.2, reward: 8, targetsTroops: true, armor: 3 },
  riot: { id: 'riot', name: 'Blindadão', hp: 900, speed: 18, damage: 34, attackInterval: 2.0, reward: 160, targetsTroops: false, isBoss: true, scale: 1.8, armor: 10 },
  // Mundo 3, Pântano: explode ao morrer e fere as tropas por perto
  bloater: { id: 'bloater', name: 'Inchado', hp: 90, speed: 26, damage: 8, attackInterval: 1.3, reward: 9, targetsTroops: true, burst: { radius: 80, damage: 40 } },
  hulk: { id: 'hulk', name: 'Monstro do Pântano', hp: 1100, speed: 18, damage: 36, attackInterval: 2.0, reward: 180, targetsTroops: false, isBoss: true, scale: 1.8, burst: { radius: 140, damage: 120 } },
  // Mundo 4, Deserto: recruta rápido e resistente
  grunt: { id: 'grunt', name: 'Recruta', hp: 85, speed: 40, damage: 11, attackInterval: 1.1, reward: 9, targetsTroops: true, armor: 2 },
  general: { id: 'general', name: 'General', hp: 1200, speed: 20, damage: 40, attackInterval: 1.8, reward: 200, targetsTroops: false, isBoss: true, scale: 1.8, armor: 6 },
  // Mundo 5, Nevasca: o golpe congela a tropa
  frost: { id: 'frost', name: 'Congelado', hp: 75, speed: 32, damage: 8, attackInterval: 1.2, reward: 9, targetsTroops: true, chill: 2.5 },
  yeti: { id: 'yeti', name: 'Abominável', hp: 1400, speed: 22, damage: 42, attackInterval: 2.0, reward: 220, targetsTroops: false, isBoss: true, scale: 1.8, chill: 3 },
  // Seção 17.4: especiais, em qualquer mundo a partir de uma fase (SPECIAL_ZOMBIES em stages.ts)
  spitter: { id: 'spitter', name: 'Cuspidor', hp: 30, speed: 34, damage: 9, attackInterval: 1.6, reward: 8, targetsTroops: true, ranged: 150 },
  digger: { id: 'digger', name: 'Escavador', hp: 70, speed: 30, damage: 10, attackInterval: 1.1, reward: 10, targetsTroops: true, burrow: { minY: 380, maxY: 520, speed: 55 } },
  splitter: { id: 'splitter', name: 'Divisor', hp: 80, speed: 30, damage: 9, attackInterval: 1.2, reward: 8, targetsTroops: true, split: { into: 'splitling', count: 2 } },
  splitling: { id: 'splitling', name: 'Pequeno', hp: 28, speed: 70, damage: 5, attackInterval: 0.8, reward: 3, targetsTroops: true, scale: 0.72 },
  shielder: { id: 'shielder', name: 'Porta-escudo', hp: 110, speed: 26, damage: 10, attackInterval: 1.3, reward: 12, targetsTroops: true, armor: 4, aura: { radius: 90, reduction: 0.4 } },
  // Seção 18.2, Ato 2: Cidade Tecnológica, Laboratório e Base de Lançamento
  android: { id: 'android', name: 'Androide', hp: 80, speed: 30, damage: 11, attackInterval: 1.1, reward: 11, targetsTroops: true, resist: { firearm: 0.5, electric: 2 } },
  colossus: { id: 'colossus', name: 'Colosso', hp: 1500, speed: 18, damage: 44, attackInterval: 2.0, reward: 240, targetsTroops: false, isBoss: true, scale: 1.8, armor: 8, resist: { firearm: 0.6, electric: 2 } },
  mutant: { id: 'mutant', name: 'Mutante', hp: 90, speed: 28, damage: 10, attackInterval: 1.2, reward: 11, targetsTroops: true, toxic: { radius: 70, dps: 6 } },
  director: { id: 'director', name: 'Diretor do Laboratório', hp: 1500, speed: 20, damage: 40, attackInterval: 2.0, reward: 250, targetsTroops: false, isBoss: true, scale: 1.8, toxic: { radius: 120, dps: 18 } },
  astronaut: { id: 'astronaut', name: 'Astronauta', hp: 70, speed: 30, damage: 10, attackInterval: 1.2, reward: 12, targetsTroops: true, suit: { ratio: 0.8, cracked: 2 } },
  padChief: { id: 'padChief', name: 'Chefe de Pista', hp: 1700, speed: 20, damage: 46, attackInterval: 2.0, reward: 260, targetsTroops: false, isBoss: true, scale: 1.8, armor: 6, burst: { radius: 160, damage: 150 } },
  // Seção 18.3, Ato 3: Estação Orbital, Lua, Marte e Colmeia
  cosmonaut: { id: 'cosmonaut', name: 'Cosmonauta', hp: 75, speed: 34, damage: 12, attackInterval: 1.2, reward: 12, targetsTroops: false, leaper: true },
  commander: { id: 'commander', name: 'Comandante da Missão', hp: 1800, speed: 22, damage: 50, attackInterval: 2.0, reward: 280, targetsTroops: false, isBoss: true, scale: 1.8, leaper: true, armor: 4 },
  lunarWorm: { id: 'lunarWorm', name: 'Verme Lunar', hp: 2000, speed: 18, damage: 52, attackInterval: 2.0, reward: 290, targetsTroops: false, isBoss: true, scale: 1.8, burrow: { minY: 560, maxY: 660, speed: 40 } },
  xeno: { id: 'xeno', name: 'Xeno', hp: 45, speed: 62, damage: 9, attackInterval: 0.8, reward: 6, targetsTroops: true, pack: 3 },
  marsTitan: { id: 'marsTitan', name: 'Titã Marciano', hp: 2100, speed: 20, damage: 54, attackInterval: 1.8, reward: 300, targetsTroops: false, isBoss: true, scale: 1.8, rage: { below: 0.5, speed: 2 } },
  pod: { id: 'pod', name: 'Casulo', hp: 120, speed: 0, damage: 0, attackInterval: 1, reward: 14, targetsTroops: false, plant: { minY: 150, maxY: 360 }, spawner: { into: 'larva', every: 4, count: 1 } },
  larva: { id: 'larva', name: 'Larva', hp: 22, speed: 75, damage: 5, attackInterval: 0.8, reward: 2, targetsTroops: true, scale: 0.65 },
  queen: { id: 'queen', name: 'Rainha Colmeia', hp: 2400, speed: 16, damage: 56, attackInterval: 2.0, reward: 340, targetsTroops: false, isBoss: true, scale: 1.8, armor: 6, spawner: { into: 'larva', every: 6, count: 2 } },
};

export const ZOMBIE_IDS = Object.keys(ZOMBIES) as ZombieId[];
