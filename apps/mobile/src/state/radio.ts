import type { Progress } from '@/state/progress';

// Mensagens de rádio já ouvidas (GDD seção 18.1).

export const isHeard = (p: Pick<Progress, 'radioHeard'>, id: string): boolean => p.radioHeard.includes(id);

/** Marca a mensagem como ouvida. Se já era, devolve o mesmo objeto. */
export function hearRadio(p: Progress, id: string): Progress {
  return isHeard(p, id) ? p : { ...p, radioHeard: [...p.radioHeard, id] };
}
