import { TRUCK_PARTS, truckPartCost, type TruckPart } from '@/game/data/truck';
import type { Progress } from '@/state/progress';

// Peças da caminhonete na Oficina (GDD seção 17.3).

/** Custo do próximo nível da peça, ou null no nível máximo. */
export function nextTruckCost(p: Pick<Progress, 'truck'>, part: TruckPart): number | null {
  const level = p.truck[part];
  return level >= TRUCK_PARTS[part].maxLevel ? null : truckPartCost(part, level);
}

export function canUpgradeTruck(p: Pick<Progress, 'truck' | 'cash'>, part: TruckPart): boolean {
  const cost = nextTruckCost(p, part);
  return cost !== null && p.cash >= cost;
}

/** Desconta o custo e sobe 1 nível. Sem dinheiro ou no máximo: devolve o mesmo objeto. */
export function upgradeTruck(p: Progress, part: TruckPart): Progress {
  if (!canUpgradeTruck(p, part)) return p;
  const cost = nextTruckCost(p, part) as number;
  return { ...p, cash: p.cash - cost, truck: { ...p.truck, [part]: p.truck[part] + 1 } };
}
