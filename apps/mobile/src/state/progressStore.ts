import { track } from '@/services/telemetry';
import * as deckRules from '@/state/decks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePersistHydrated } from '@/hooks/usePersistHydrated';
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
import { claimAchievement, claimAllAchievements } from '@/state/achievements';
import { type MatchRecord, recordMatch } from '@/state/bestiary';
import { membershipReward } from '@/state/membershipRewards';
import type { MembershipGrant } from '@zombie-road/shared/api';

interface ProgressActions {
  paintTruck(paint: rules.Progress['truckPaint']): void;
  canPaint(paint: rules.Progress['truckPaint']): boolean;
  readDiary(): void;
  applyServerCoins(ref: string, coins: number): boolean;
  setTutorial(step: number): void;
  selectDeck(index: number): boolean;
  renameDeck(name: string): boolean;
  duplicateDeck(destination: number): boolean;
  replaceCard(from: CardId, to: CardId): boolean;
  moveCard(card: CardId, direction: -1 | 1): boolean;
  addCash(amount: number): void;
  /** Retorna true se subiu o nível. */
  upgradeCard(card: CardId): boolean;
  removeFromDeck(card: CardId): boolean;
  /** `at`: posição no deck (padrão: no fim). */
  addToDeck(card: CardId, at?: number): boolean;
  selectStage(stage: number): boolean;
  /** Registra a vitória com as estrelas; retorna o bônus pago pelas estrelas novas. */
  clearStage(stage: number, stars: number): number;
  failStage(stage: number): void;
  grantMembership(grant: MembershipGrant): void;
  /** Apaga todo o progresso (Ajustes). */
  reset(): void;
  /** Retorna true se a peça da caminhonete subiu de nível. */
  upgradeTruck(part: TruckPart): boolean;
  /** Soma zumbis vistos, abates e cartas jogadas de uma partida. */
  recordMatch(record: MatchRecord): void;
  /** Resgata o próximo marco da conquista; retorna o prêmio (0 se não havia). */
  claimAllAchievements(): void;
  claimAchievement(id: AchievementId): number;
  /** Fim da Sobrevivência; retorna true se foi recorde. */
  recordExpedition(waves: number): boolean;
  recordSurvival(waves: number): boolean;
  /** Marca a mensagem de rádio como ouvida. */
  hearRadio(id: string): void;
  /** Troca o progresso inteiro (save da nuvem), já conferido pela migração. */
  replace(saved: unknown, version: number): void;
}

export type ProgressStore = rules.Progress & ProgressActions;

// Suba a versão e trate em migrateProgress sempre que o formato salvo mudar.
export const STORAGE_VERSION = 15;

/** Só os campos salvos do progresso (sem as ações). */
export function pick(state: rules.Progress): rules.Progress {
  const { cash, cardLevels, deck, savedDecks, selectedDeck, tutorialStep, serverRewards, mastery, truckPaint, seasonCosmetics, diaryRead, currentStage, highestCleared, highestFailedStage, membershipRewards, stars, truck, seen, kills, cardsPlayed, claimed, expeditionBest, survivalBest, radioHeard } = state;
  return { cash, cardLevels, deck, savedDecks, selectedDeck, tutorialStep, serverRewards, mastery, truckPaint, seasonCosmetics, diaryRead, currentStage, highestCleared, highestFailedStage, membershipRewards, stars, truck, seen, kills, cardsPlayed, claimed, expeditionBest, survivalBest, radioHeard };
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get): ProgressStore => {
      // As regras devolvem o mesmo objeto quando nada muda.
      const apply = (rule: (p: rules.Progress) => rules.Progress) => {
        const current = pick(get());
        const next = rule(current);
        if (next === current) return false;
        if (next.deck !== current.deck) next.savedDecks = next.savedDecks.map((d, i) => i === next.selectedDeck ? { ...d, cards: [...next.deck] } : d);
        set(next);
        return true;
      };
      return {
        ...rules.initialProgress(),
        canPaint: (paint) => paint === 'stock' || paint === 'crimson' && get().highestCleared >= 10 || paint === 'arctic' && Object.values(get().mastery).reduce((a,n) => a + (n ?? 0),0) >= 100 || paint === 'season' && get().seasonCosmetics.length > 0,
        paintTruck: (paint) => { if (get().canPaint(paint)) set({ truckPaint: paint }); },
        readDiary: () => set({ diaryRead: [...get().radioHeard] }),
        applyServerCoins: (ref, coins) => { if (get().serverRewards.includes(ref)) return false; set((p) => ({ cash: p.cash + Math.max(0, coins), serverRewards: [...p.serverRewards, ref] })); return true; },
        setTutorial: (step) => set({ tutorialStep: Math.max(0, Math.min(5, step)) }),
        selectDeck: (index) => apply((p) => deckRules.selectDeck(p, index)),
        renameDeck: (name) => apply((p) => deckRules.renameDeck(p, name)),
        duplicateDeck: (destination) => apply((p) => deckRules.duplicateDeck(p, destination)),
        replaceCard: (from, to) => apply((p) => deckRules.replaceCard(p, from, to)),
        moveCard: (card, direction) => apply((p) => deckRules.moveCard(p, card, direction)),
        addCash: (amount: number) => {
          apply((p) => rules.addCash(p, amount));
        },
        upgradeCard: (card: CardId) => {
          const changed = apply((p) => rules.upgradeCard(p, card));
          if (changed && get().tutorialStep === 4) { set({ tutorialStep: 5 }); track('tutorial_completed'); }
          return changed;
        },
        removeFromDeck: (card: CardId) => apply((p) => rules.removeFromDeck(p, card)),
        addToDeck: (card: CardId, at?: number) => apply((p) => rules.addToDeck(p, card, at)),
        selectStage: (stage: number) => apply((p) => rules.selectStage(p, stage)),
        failStage: (stage: number) => { apply((p) => rules.failStage(p, stage)); },
        clearStage: (stage: number, stars: number) => {
          const bonus = starReward(pick(get()), stage, stars);
          apply((p) => rules.clearStage(p, stage, stars));
          return bonus;
        },
        reset: () => set({ ...rules.initialProgress(), membershipRewards: get().membershipRewards, serverRewards: get().serverRewards }),
        grantMembership: (grant) => { apply((p) => membershipReward(p, grant)); },
        upgradeTruck: (part: TruckPart) => apply((p) => truckRules.upgradeTruck(p, part)),
        recordMatch: (record: MatchRecord) => {
          apply((p) => recordMatch(p, record));
        },
        recordExpedition: (waves) => { if (waves <= get().expeditionBest) return false; set({ expeditionBest: waves }); return true; },
        recordSurvival: (waves: number) => apply((p) => rules.recordSurvival(p, waves)),
        replace: (saved: unknown, version: number) => set(migrateProgress(saved, version)),
        hearRadio: (id: string) => {
          apply((p) => hearRadio(p, id));
        },
        claimAllAchievements: () => { apply(claimAllAchievements); },
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
  return usePersistHydrated(useProgressStore);
}
