export const EXPEDITION_UNLOCK = 20;
export const EXPEDITION_REWARD_FACTOR = 0.75;
export const EXPEDITION_STACK_LIMIT = 3;
export const EXPEDITION_BOONS = ['blood','attack','repair','hull'] as const;
export type ExpeditionBoon = typeof EXPEDITION_BOONS[number];
export const EXPEDITION_BALANCE = { blood: 0.15, attack: 0.1, repair: 0.25, hull: 0.1 };
