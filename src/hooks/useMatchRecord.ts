import { useEffect, useRef } from 'react';

import type { GameEvent } from '@/game/types';
import { emptyRecord } from '@/state/bestiary';
import { useProgressStore } from '@/state/progressStore';

/**
 * Junta os zumbis vistos, os abates e as cartas jogadas da partida e grava tudo de uma vez no
 * progresso: no fim da partida e ao sair da tela (sem escrever no celular a cada evento).
 */
export function useMatchRecord() {
  const record = useRef(emptyRecord());

  const flush = () => {
    const current = record.current;
    record.current = emptyRecord();
    useProgressStore.getState().recordMatch(current);
  };

  useEffect(() => flush, []);

  const onEvent = (event: GameEvent) => {
    const r = record.current;
    if (event.type === 'zombieSpawned' && !r.seen.includes(event.zombie)) r.seen.push(event.zombie);
    else if (event.type === 'zombieKilled') r.kills[event.zombie] = (r.kills[event.zombie] ?? 0) + 1;
    else if (event.type === 'cardPlayed') r.cardsPlayed++;
  };

  return { onEvent, flush };
}
