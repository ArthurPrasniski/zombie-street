import type { CardDef, CardId, SpellDef, SpellId, TroopDef, TroopId } from '@/game/types';

// Seção 6.1: tropas
export const TROOPS: Record<TroopId, TroopDef> = {
  sniper: { kind: 'troop', id: 'sniper', name: 'Mira', weapon: 'Rifle', cost: 4, role: 'ranged', hp: 80, damage: 34, attackInterval: 1.8, range: 600, speed: 0, firearm: true },
  sheriff: { kind: 'troop', id: 'sheriff', name: 'Xerife', weapon: 'Revólver', cost: 3, role: 'ranged', hp: 120, damage: 12, attackInterval: 0.8, range: 320, speed: 0, firearm: true },
  shotgun: { kind: 'troop', id: 'shotgun', name: 'Bruno', weapon: 'Escopeta', cost: 3, role: 'ranged', hp: 160, damage: 18, attackInterval: 1.2, range: 160, speed: 0, firearm: true, splash: { targets: 2, radius: 60 } },
  chainsaw: { kind: 'troop', id: 'chainsaw', name: 'Serra', weapon: 'Motosserra', cost: 4, role: 'melee', hp: 220, damage: 26, attackInterval: 1.0, range: 45, speed: 60, firearm: false },
  dog: { kind: 'troop', id: 'dog', name: 'Rex', weapon: 'Mordida', cost: 2, role: 'melee', hp: 90, damage: 14, attackInterval: 0.7, range: 30, speed: 110, firearm: false },
  barricade: { kind: 'troop', id: 'barricade', name: 'Barricada', weapon: 'Madeira e arame', cost: 3, role: 'structure', hp: 600, damage: 0, attackInterval: 1, range: 0, speed: 0, firearm: false, building: true },
  soldier: { kind: 'troop', id: 'soldier', name: 'Soldado', weapon: 'Metralhadora', cost: 4, role: 'ranged', hp: 140, damage: 6, attackInterval: 0.22, range: 280, speed: 0, firearm: true },
  firefighter: { kind: 'troop', id: 'firefighter', name: 'Bombeiro', weapon: 'Lança-chamas', cost: 4, role: 'ranged', hp: 200, damage: 7, attackInterval: 0.3, range: 120, speed: 0, firearm: false, splash: { targets: 5, radius: 70 }, fx: 'flame' },
  medic: { kind: 'troop', id: 'medic', name: 'Médica', weapon: 'Maleta', cost: 3, role: 'support', hp: 110, damage: 0, attackInterval: 1, range: 160, speed: 0, firearm: false, heal: 14 },
  crossbow: { kind: 'troop', id: 'crossbow', name: 'Lara', weapon: 'Besta', cost: 4, role: 'ranged', hp: 90, damage: 45, attackInterval: 2, range: 520, speed: 0, firearm: false, pierce: { width: 26, max: 4 }, fx: 'bolt' },
  turret: { kind: 'troop', id: 'turret', name: 'Torreta', weapon: 'Metralhadora automática', cost: 4, role: 'ranged', hp: 300, damage: 9, attackInterval: 0.5, range: 280, speed: 0, firearm: true, building: true, lifetime: 25 },
  // Seção 18.4: armas sci-fi do Ato 2
  drone: { kind: 'troop', id: 'drone', name: 'Drone', weapon: 'Metralhadora leve', cost: 3, role: 'ranged', hp: 70, damage: 5, attackInterval: 0.3, range: 260, speed: 0, firearm: true, flying: true },
  tesla: { kind: 'troop', id: 'tesla', name: 'Torre Tesla', weapon: 'Bobina', cost: 4, role: 'ranged', hp: 260, damage: 16, attackInterval: 1.0, range: 220, speed: 0, firearm: false, electric: true, building: true, lifetime: 30, chain: { jumps: 3, radius: 90, falloff: 0.8 } },
  laser: { kind: 'troop', id: 'laser', name: 'Cabo Laser', weapon: 'Rifle laser', cost: 4, role: 'ranged', hp: 110, damage: 9, attackInterval: 0.25, range: 340, speed: 0, firearm: false, pierce: { width: 18, max: 5 }, fx: 'laser' },
  titan: { kind: 'troop', id: 'titan', name: 'Exotraje Titã', weapon: 'Punhos hidráulicos', cost: 5, role: 'melee', hp: 520, damage: 30, attackInterval: 1.1, range: 42, speed: 45, firearm: false, knockback: 40, scale: 1.25 },
};

// Seção 6.2: armas especiais
export const SPELLS: Record<SpellId, SpellDef> = {
  grenade: { kind: 'spell', id: 'grenade', name: 'Granada', cost: 2, radius: 110, damage: 70 },
  medkit: { kind: 'spell', id: 'medkit', name: 'Kit médico', cost: 2, radius: 150, heal: 0.5 },
  molotov: { kind: 'spell', id: 'molotov', name: 'Molotov', cost: 3, radius: 90, dps: 25, duration: 4 },
  airstrike: { kind: 'spell', id: 'airstrike', name: 'Ataque aéreo', cost: 6, radius: 160, damage: 300, delay: 1.5 },
  landmine: { kind: 'spell', id: 'landmine', name: 'Mina', cost: 2, radius: 90, damage: 120, trigger: 35 },
  // Seção 18.4: armas especiais do Ato 3
  cryo: { kind: 'spell', id: 'cryo', name: 'Criogenia', cost: 3, radius: 120, damage: 30, freeze: 2, duration: 3 },
  forcefield: { kind: 'spell', id: 'forcefield', name: 'Escudo de Energia', cost: 4, radius: 90, wallHp: 400, width: 180, duration: 8 },
  blackhole: { kind: 'spell', id: 'blackhole', name: 'Buraco Negro', cost: 5, radius: 150, damage: 260, pull: 160, duration: 3 },
  orbital: { kind: 'spell', id: 'orbital', name: 'Canhão Orbital', cost: 6, radius: 50, width: 100, damage: 420, delay: 1 },
};

export const CARDS: Record<CardId, CardDef> = { ...TROOPS, ...SPELLS };

export const TROOP_IDS = Object.keys(TROOPS) as TroopId[];
export const SPELL_IDS = Object.keys(SPELLS) as SpellId[];
export const CARD_IDS: CardId[] = [...TROOP_IDS, ...SPELL_IDS];

// Seção 6.3: coleção e deck
export const DECK_SIZE = 8;
export const HAND_SIZE = 4;
export const STARTER_DECK: CardId[] = ['sniper', 'sheriff', 'chainsaw', 'dog', 'barricade', 'grenade', 'medkit', 'molotov'];
/** Fase (1 a 50) que precisa ser vencida para liberar a carta (as do deck inicial já vêm liberadas). */
export const CARD_UNLOCKS: Partial<Record<CardId, number>> = {
  shotgun: 3, airstrike: 6, soldier: 8, landmine: 12, firefighter: 16, medic: 22, crossbow: 28, turret: 34,
  drone: 53, tesla: 58, laser: 65, titan: 74,
  cryo: 84, forcefield: 92, blackhole: 103, orbital: 112,
};

export const isTroop = (card: CardDef): card is TroopDef => card.kind === 'troop';
