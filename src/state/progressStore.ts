import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TruckPart } from '@/game/data/truck';
import type { CardId } from '@/game/types';
import { migrateProgress } from '@/state/migrate';
import * as rules from '@/state/progress';
import { starReward } from '@/state/stars';
import * as truckRules from '@/state/truck';
import { hearRadio } from '@/state/radio';
import type { AchievementId } from '@/game/data/achievements';
import { claimAchievement } from '@/state/achievements';
import { type MatchRecord, recordMatch } from '@/state/bestiary';

interface ProgressActions {
  addCash(amount: number): void;
  /** Retorna true se subiu o nível. */
  upgradeCard(card: CardId): boolean;
  removeFromDeck(card: CardId): boolean;
  /** `at`: posição no deck (padrão: no fim). */
  addToDeck(card: CardId, at?: number): boolean;
  selectStage(stage: number): boolean;
  /** Registra a vitória com as estrelas; retorna o bônus pago pelas estrelas novas. */
  clearStage(stage: number, stars: number): number;
  /** Apaga todo o progresso (Ajustes). */
  reset(): void;
  /** Retorna true se a peça da caminhonete subiu de nível. */
  upgradeTruck(part: TruckPart): boolean;
  /** Soma zumbis vistos, abates e cartas jogadas de uma partida. */
  recordMatch(record: MatchRecord): void;
  /** Resgata o próximo marco da conquista; retorna o prêmio (0 se não havia). */
  claimAchievement(id: AchievementId): number;
  /** Fim da Sobrevivência; retorna true se foi recorde. */
  recordSurvival(waves: number): boolean;
  /** Marca a mensagem de rádio como ouvida. */
  hearRadio(id: string): void;
  /** Troca o progresso inteiro (save da nuvem), já conferido pela migração. */
  replace(saved: unknown, version: number): void;
}

export type ProgressStore = rules.Progress & ProgressActions;

// Suba a versão e trate em migrateProgress sempre que o formato salvo mudar.
export const STORAGE_VERSION = 8;

/** Só os campos salvos do progresso (sem as ações). */
export function pick(state: rules.Progress): rules.Progress {
  const { cash, cardLevels, deck, currentStage, highestCleared, stars, truck, seen, kills, cardsPlayed, claimed, survivalBest, radioHeard } = state;
  return { cash, cardLevels, deck, currentStage, highestCleared, stars, truck, seen, kills, cardsPlayed, claimed, survivalBest, radioHeard };
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get): ProgressStore => {
      // As regras devolvem o mesmo objeto quando nada muda.
      const apply = (rule: (p: rules.Progress) => rules.Progress) => {
        const current = pick(get());
        const next = rule(current);
        if (next === current) return false;
        set(next);
        return true;
      };
      return {
        ...rules.initialProgress(),
        addCash: (amount: number) => {
          apply((p) => rules.addCash(p, amount));
        },
        upgradeCard: (card: CardId) => apply((p) => rules.upgradeCard(p, card)),
        removeFromDeck: (card: CardId) => apply((p) => rules.removeFromDeck(p, card)),
        addToDeck: (card: CardId, at?: number) => apply((p) => rules.addToDeck(p, card, at)),
        selectStage: (stage: number) => apply((p) => rules.selectStage(p, stage)),
        clearStage: (stage: number, stars: number) => {
          const bonus = starReward(pick(get()), stage, stars);
          apply((p) => rules.clearStage(p, stage, stars));
          return bonus;
        },
        reset: () => set(rules.initialProgress()),
        upgradeTruck: (part: TruckPart) => apply((p) => truckRules.upgradeTruck(p, part)),
        recordMatch: (record: MatchRecord) => {
          apply((p) => recordMatch(p, record));
        },
        recordSurvival: (waves: number) => apply((p) => rules.recordSurvival(p, waves)),
        replace: (saved: unknown, version: number) => set(migrateProgress(saved, version)),
        hearRadio: (id: string) => {
          apply((p) => hearRadio(p, id));
        },
        claimAchievement: (id: AchievementId) => {
          const before = get().cash;
          apply((p) => claimAchievement(p, id));
          return get().cash - before;
        },
      };
    },
    {
      name: 'estrada-zumbi/progress',
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: pick,
      // Saves antigos viram o formato atual (src/state/migrate.ts).
      migrate: (saved, version) => migrateProgress(saved, version) as ProgressStore,
      // Mesmo sem mudar a versão, todo save carregado é conferido: cartas, mundos e campos novos
      // entram com o valor inicial (ex.: uma carta nova sem nível vira nível 1).
      merge: (saved, current) => ({ ...current, ...migrateProgress(saved, STORAGE_VERSION) }),
    },
  ),
);

/** true depois que o progresso salvo foi carregado do celular. */
export function useProgressHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useProgressStore.persist.hasHydrated());
  useEffect(() => {
    if (useProgressStore.persist.hasHydrated()) setHydrated(true);
    return useProgressStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
